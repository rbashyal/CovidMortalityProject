library("tidyr")
library("tidyverse")
library("dplyr")
library("lubridate")
library("tigris")
library("fastDummies")
library("broom")
library("sandwich")
library("lmtest")
library("car")
library("stargazer")
library("AER")
library("margins")
library("emmeans")
library("jsonlite")
setwd("C:\\Users\\risha\\Google Drive\\Codeacademy\\D3.js\\Covid Project\\Raw Data")

#read in State daily COVID data from NYT github page 
#data is cumulative numbers at the end of each day

fips <- fips_codes %>%
  select(state, state_code, state_name)%>%
  unique()

nyt_covid_state <- read_csv("nyt_covid_state.csv", col_names = TRUE
                            ,col_types = list(date = col_date(format = "%Y-%m-%d")
                                              ,state = col_character()
                                              ,fips = col_character()
                                              ,cases = col_integer()
                                              ,deaths = col_integer()
                                              )
)


#start_dt <- "2020-12-21"
#cut_off_dt = "2021-05-09"

start_dt <- "2020-12-21"
cut_off_dt = "2021-11-28"

#cut_off_dt = cut_off_dt

nyt_covid_state <- nyt_covid_state%>%
  # add an indicator for week (starting Monday) and year
  mutate(week = isoweek(date)
         ,year = ifelse(isoweek(date) == 53 & year(date) == 2021 & month(date) ==1, 2020, year(date))) %>%
  # Restrict to days on or after Dec 21 2021
    filter(date >= as.Date(start_dt) & date <= as.Date(cut_off_dt))%>%
  # get cumulative number of deaths and cases at the end of each week 
    group_by(state, fips, year, week) %>%
    summarize(cum_deaths = max(deaths)
              ,cum_cases = max(cases)
              ,first_day = min(date)
              ,last_day = max(date)
              )

#read in vaccination data
vaccination_state <- read_csv("historical-usa-doses-administered_bloomberg.csv", col_types = list(date = col_date(format = "%Y-%m-%d")))%>%
  rename(Date = date, Location = id, Administered = value)%>%
  filter(Date >= as.Date(start_dt) & Date <= as.Date(cut_off_dt))%>%
  arrange(Location, Date)%>%
  left_join(fips, by = c("Location" = "state"))%>%
  rename(fips = state_code, state = Location)%>%
  mutate(year = ifelse(isoweek(Date) == 53 & year(Date) == 2021 & month(Date) ==1, 2020, year(Date))
         ,week = isoweek(Date))

  #cumulative number of dosage administered at end of the week
vaccination_state <- vaccination_state%>%
  group_by(state, fips, year, week)%>%
  summarize(cum_dose_admin = max(Administered))%>%
  filter(nchar(state) == 2)


#read in adult population count by state

state_pop_18 <- read_csv("sc-est2020-18+pop-res.csv")%>%
  select(STATE, POPEST18PLUS2020)%>%
  rename(fips = STATE)%>%
  filter(!(fips =="00"))

#express cumulative dosage administered as per per100 adult population
vaccination_state <- vaccination_state%>%
  left_join(state_pop_18, by = c("fips" = "fips"))%>%
  mutate(Admin_per100_18 = ceiling((cum_dose_admin/POPEST18PLUS2020)*100))


#regression dataset


reg_dta_no_dum <- nyt_covid_state%>%
  left_join(vaccination_state, by = c("fips"= "fips", "year" = "year", "week" = "week" ))%>%
  filter(!is.na(Admin_per100_18))%>%
  mutate(time_cat = paste(year, week, sep="_"))%>%
  rename(st = state.y)%>%
  arrange(st, last_day)%>%
  group_by(st)%>%
  mutate(Admin_per100_18.lag1 = dplyr::lag(Admin_per100_18, n = 1L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag2 = dplyr::lag(Admin_per100_18, n = 2L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag3 = dplyr::lag(Admin_per100_18, n = 3L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag4 = dplyr::lag(Admin_per100_18, n = 4L, default = NA, order_by = last_day)
         ,cum_deaths_per100_18 = (cum_deaths/POPEST18PLUS2020)*100
         ,cum_cases_per100_18 = (cum_cases/POPEST18PLUS2020)*100
         ,delta_era = ifelse(last_day >= as.Date("2021-07-01"),1, 0)
  )

reg_dta <- nyt_covid_state%>%
  left_join(vaccination_state, by = c("fips"= "fips", "year" = "year", "week" = "week" ))%>%
  filter(!is.na(Admin_per100_18))%>%
  mutate(time_cat = paste(year, week, sep="_"))%>%
  rename(st = state.y)%>%
  arrange(st, last_day)%>%
  dummy_cols(select_columns = "time_cat", remove_first_dummy = TRUE)%>%
  dummy_cols(select_columns = "st", remove_first_dummy = TRUE)%>%
  group_by(st)%>%
  mutate(Admin_per100_18.lag1 = dplyr::lag(Admin_per100_18, n = 1L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag2 = dplyr::lag(Admin_per100_18, n = 2L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag3 = dplyr::lag(Admin_per100_18, n = 3L, default = NA, order_by = last_day)
         ,Admin_per100_18.lag4 = dplyr::lag(Admin_per100_18, n = 4L, default = NA, order_by = last_day)
         ,cum_deaths_per100_18 = (cum_deaths/POPEST18PLUS2020)*100
         ,cum_cases_per100_18 = (cum_cases/POPEST18PLUS2020)*100
         ,delta_era = ifelse(last_day >= as.Date("2021-07-01"),1, 0)
          
         )


delta_dummy <- "delta_era"
outcome <- "cum_deaths_per100_18"
state_controls <- names(reg_dta)[grep("^st_", names(reg_dta))]
time_controls <- names(reg_dta)[grep("^time_cat_", names(reg_dta))]
vaccine_intensity <- names(reg_dta)[grep("Admin_per100_18", names(reg_dta))]
covariates <- c(vaccine_intensity, state_controls, time_controls)

formula <- as.formula(paste(outcome, paste(covariates, collapse = " + "), sep = " ~ "))

#run regression
qpois <- glm(formula, family = "quasipoisson", data = reg_dta, na.action = na.exclude)


#perform cluster robust std errors
qpois_cl_robust <-coeftest(qpois, vcov = sandwich::vcovCL(qpois, cluster = ~ st))

stargazer(qpois, qpois_cl_robust, out = "qpois_models.txt")



#get predicted y_hat - convert to counts

#predicted death count - realized 
y_hat_realized <-predict(qpois, type= "response", se.fit = TRUE, na.action = na.exclude)
pred_realized <- data.frame(reg_dta_no_dum, y_hat_realized$fit, y_hat_realized$se.fit)


#Predicted death count - counterfactual data where all vaccination variables set to zero
cf_dta <- reg_dta%>%
  mutate(Admin_per100_18 = 0 
         ,Admin_per100_18.lag1 = 0
         ,Admin_per100_18.lag2 = 0
         ,Admin_per100_18.lag3 = 0
         ,Admin_per100_18.lag4 = 0)
y_hat_cf <- predict(qpois, type= "response", newdata= cf_dta, se.fit = TRUE, na.action = na.exclude)
pred_cf <- data.frame(reg_dta_no_dum, y_hat_cf$fit, y_hat_cf$se.fit)%>%
  select(st, year, week, y_hat_cf.fit, y_hat_cf.se.fit)


##final predicted death by state-week (realized and predicted)

d3_pred_averted_deaths <- pred_realized%>%
  left_join(pred_cf, by = c("st", "year", "week"))%>%
  filter(!is.na(y_hat_realized.fit))%>%
  mutate(ad = y_hat_cf.fit - y_hat_realized.fit
         #sum var(se fit realized) and var(se fit counterfactual) and take square root
         #this is my estimate of SE of Averted Deaths
         ,se_ad = sqrt(y_hat_realized.se.fit^2+y_hat_cf.se.fit^2)
         ,ci_low_ad = ad-1.96*se_ad
         ,ci_high_ad = ad+1.96*se_ad
         ,AD = ceiling(ad*POPEST18PLUS2020/100)
         ,CI_LOW_AD = ceiling(ci_low_ad*POPEST18PLUS2020/100)
         ,CI_HIGH_AD = ceiling(ci_high_ad*POPEST18PLUS2020/100)
        )%>%
  select(st, year, week, last_day, ad, se_ad, ci_low_ad, ci_high_ad, AD, CI_LOW_AD, CI_HIGH_AD)

d3_pred_deaths <- pred_realized%>%
  left_join(pred_cf, by = c("st", "year", "week"))%>%
  filter(!is.na(y_hat_realized.fit))%>%
  
  mutate(
        #predicted deaths per 100 population - without vaccine
        death_vacc0 = y_hat_cf.fit
        #se of predicted deaths per 100 population - without vaccine
         ,se_death_vacc0 = y_hat_cf.se.fit
        #Confidence Interval of predicted deaths per 100 population - without vaccine
         ,ci_death_vacc0_low = death_vacc0-1.96*se_death_vacc0
         ,ci_death_vacc0_high = death_vacc0+1.96*se_death_vacc0
        #Predicted death count - without vaccine
         ,DEATH_VACC0 = ceiling(death_vacc0*POPEST18PLUS2020/100)
        #Confidence Interval of predicted death in raw count scale - without Vaccine 
         ,CI_DEATH_VACC0_LOW = ceiling(ci_death_vacc0_low*POPEST18PLUS2020/100)
         ,CI_DEATH_VACC0_HIGH = ceiling(ci_death_vacc0_high*POPEST18PLUS2020/100)
        #predicted deaths per 100 population - with vaccine
         ,death_vacc1 = y_hat_realized.fit
        #se of predicted deaths per 100 population - with vaccine
         ,se_death_vacc1 = y_hat_realized.se.fit
        #Confidence Interval of predicted deaths per 100 population - with vaccine
         ,ci_death_vacc1_low = death_vacc1-1.96*se_death_vacc1
         ,ci_death_vacc1_high = death_vacc1+1.96*se_death_vacc1
        #Predicted death in raw count scale - with vaccine
         ,DEATH_VACC1 = ceiling(death_vacc1*POPEST18PLUS2020/100)
        #Confidence Interval of predicted death in raw count scale - with Vaccine 
         ,CI_DEATH_VACC1_LOW = ceiling(ci_death_vacc1_low*POPEST18PLUS2020/100)
         ,CI_DEATH_VACC1_HIGH = ceiling(ci_death_vacc1_high*POPEST18PLUS2020/100)
  )%>%
  select(st, year, week, last_day, cum_deaths, DEATH_VACC0, CI_DEATH_VACC0_LOW, CI_DEATH_VACC0_HIGH
                                 ,   DEATH_VACC1, CI_DEATH_VACC1_LOW, CI_DEATH_VACC1_HIGH)
  


##calculate total deaths averted in time t = T across all states
#se of estimated total averted deaths - realized
#se of estimated total averted deaths - counter factual

d3_pred_deaths_national <- d3_pred_deaths%>%
  group_by(last_day)%>%
  mutate(st = "US")%>%
  summarize(st = max(st)
            ,year = max(year)
            ,week = max(week)
            ,cum_deaths = sum(cum_deaths)
            ,DEATH_VACC0 = sum(DEATH_VACC0)
            ,CI_DEATH_VACC0_LOW = sum(CI_DEATH_VACC0_LOW)
            ,CI_DEATH_VACC0_HIGH = sum(CI_DEATH_VACC0_HIGH)
            ,DEATH_VACC1 = sum(DEATH_VACC1)
            ,CI_DEATH_VACC1_LOW = sum(CI_DEATH_VACC1_LOW)
            ,CI_DEATH_VACC1_HIGH = sum(CI_DEATH_VACC1_HIGH)
            )
d3_table_deaths <- bind_rows(d3_pred_deaths_national, d3_pred_deaths)


d3_Averted_deaths_nat <- d3_pred_averted_deaths%>%
  group_by(last_day)%>%
  summarize(year = max(year)
            ,week = max(week)
            ,last_day = max(last_day)
            ,AD = sum(AD)
            ,CI_LOW_AD = sum(CI_LOW_AD)
            ,CI_HIGH_AD = sum(CI_HIGH_AD))%>%
  mutate(st = "US")

#final data for D3 visualization
d3_Averted_deaths_st <- d3_pred_averted_deaths%>%
  select(st, year, week, last_day, AD, CI_LOW_AD, CI_HIGH_AD)
d3_Averted_deaths <- bind_rows(d3_Averted_deaths_nat, d3_Averted_deaths_st)

#remove unnecessary data 
rm(d3_Averted_deaths_nat, d3_Averted_deaths_st, d3_pred_deaths_national, d3_pred_deaths )


##turn datasets into json format


json_deaths <- d3_table_deaths%>%

  group_by(st)%>%
  summarise(last_day = list(last_day)
            ,year = list(year)
            ,week = list(week)
            ,cum_deaths = list(cum_deaths)
            ,DEATH_VACC0 = list(DEATH_VACC0)
            ,CI_DEATH_VACC0_LOW = list(CI_DEATH_VACC0_LOW)
            ,CI_DEATH_VACC0_HIGH = list(CI_DEATH_VACC0_HIGH)
            ,DEATH_VACC1 = list(DEATH_VACC1)
            ,CI_DEATH_VACC1_LOW = list(CI_DEATH_VACC1_LOW)
            ,CI_DEATH_VACC1_HIGH = list(CI_DEATH_VACC1_HIGH))%>%
  toJSON(pretty = TRUE)

write_json(json_deaths, "json_deaths.js")

json_averted_deaths <- d3_Averted_deaths%>%
  
  group_by(st)%>%
  summarise(last_day = list(last_day)
            ,year = list(year)
            ,week = list(week)
            ,AD = list(AD)
            ,CI_LOW_AD = list(CI_LOW_AD)
            ,CI_HIGH_AD = list(CI_HIGH_AD)
            )%>%
  toJSON(pretty = TRUE)

write_json(json_averted_deaths, "json_averted_deaths.js")






