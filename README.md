# CovidMortalityProject

### Visualize estimates of COVID-19 Deaths averted due to vaccines  

This project aims to replicate and visualize the results of the following paper:

*Vaccinations Against COVID-19 May Have Averted Up To 140,000 Deaths In The United States
Sumedha Gupta, Jonathan Cantor, Kosali I. Simon, Ana I. Bento, Coady Wing, and Christopher M. Whaley
Health Affairs 2021 40:9, 1465-1472*

The overall steps are:
 
 1. Get cumulative daily data on Covid mortality from NYC COVID data github and cumulative daily Vaccination count from Bloomberg
 2. Run a Poiosson model on a State-Week level panel data where the outcome is cumulative death at the end of each week and covariates include cumulative vaccination count for each week and their 4 lags
    1. Include time and state control dummies
 3. Get predicted cumulative deaths at the end of each week for each US state 
 4. Set all vaccination variables to zero and re-compute the predicted weekly cumuative deaths
 5. For each state-week, the difference between the predicted deaths, with and without vaccination variables, represets the estimate of averted deaths
 6. Use d3.js to visualize these numbers

