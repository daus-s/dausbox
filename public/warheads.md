
# WARHeads
### v0.2.0
#### Daus Carmichael


## Overview
The Warheads prediction engine is a sports analytics engine that combines multiple sources of data to optimize the profitability of betting strategies. The initial analyses of the NBA is performed with a standard team-wise Elo rating procession. The early NBA is used to "seed" the ratings. This means that as current players enter the league, their impact and rating will be adjusted accordingly based on the current state of the league. The `elo-v1` algorithm performs moderately well, beating the random guess model and achieving a accuracy of 62%. This procession was optimized using the Nelder-Mead optimization technique to find the most responsive and performant scale factor and step values. 

Secondary algorithms are used to improve the accuracy and confidence of the models. This includes a win-share algorithm based on the logistic model akin to the WAR equation in baseball. This model was trained on data from the 1984 postseason (when recorded stats were standardized), through the current season. It can successfully classify a boxscore as a winning or losing statline 81% of the time with an impressive cross-entropy score of 0.42. This equation is used to generate the contribution each player provided (or is expected to provide for a future game). 

The main feature of the WARHeads library is the `Model` trait. There are 5 methods required by the implementation. Their signatures are:
```
fn model_name(&self) -> String;
fn initialize(&mut self) -> Result<(), ()>;
fn train(&mut self, data: Chronology) -> Result<(), TrainingError>;
fn evaluate(&self) -> HashMap<String, f64>;
fn predict(&mut self, obj: &GameCard) -> f64;
``` 
For more information see the [developing models](#developing-models) section. Users can define their own models using the flexible and efficient data access provided by `Chronology`. 

WARHeads remains in constant development and new features and imrpovements will be added once stabilized.  

## Highlights
- easy to use machine learning framework for NBA analytics
- optimization methods/techniques including nelder-mead, gradient descent, and closed form solution to linear regression
- **62% accuracy and a log loss of 0.640**
- **nelder mead optimization of `k` and `s` parameters**

## Usage
this section will go over cover how to run the provided models and generate predictions for upcoming . 
The executable can be created in whichever directory is preferred and can be invoked as:
```
user$ ./warheads <COMMAND> <OPTIONAL_ARGS>
```
by default when compiled with cargo the executable can be found in the `target` directory.  

### Commands
| Command | Arguments | Syntax |Network| Description
| --- | --- | --- | :---: |---|
| Initialize | `None` | `warheads init` | ✅ | Initializes the local file system sourcing data from NBA.com.
| Synchronize | `None` | `warheads sync` | ✅ | Fetches and chronicles live data from NBA.com
| Checksum | `fingerprint` `verify` | `warheads checksum verify` | ❌ | Generates or verifies checksums of local source data. Used to eliminate redundant network calls to NBA.com
 | Train | `<MODEL_NAME>`	|`warheads train <MODEL_NAME> -- [options]`| ❌ |Train a model as defined in the trait implementation.
 | Evaluate | `<MODEL_NAME>` | `warheads eval <MODEL_NAME>` | ❌ | Return a map of metrics and values used to measure the performance of the model. Defined in Model implementation
  | Forecast | `<MODEL_NAME>`, `--days=N` | `warheads eval <MODEL_NAME>` | ❌ | Return the predictions for the next $N$ games with a text based UI. 
  | Help | `None` | `warheads` or `warheads help` | ❌ | Provides a help menu describing the commands provided by the WARHeads executable.
 



### Developing Models

### Dependencies
 
 - `cargo 1.92` (tested/developed on 1.92.0)
 - Network access: in order to fetch historical data and the upcoming schedule certain commands require network access (`init`,`sync`,`forecast`). See [Usage](#usage) for more info.

 ### Steps
 1) **Clone the repo**
 
 ```
 git clone git@github.com:daus-s/warheads.git
 ```
 
 2) **Create .env file**
 
 once the repo is initialized, in the main directory run this command. this will be used for warheads to generate source files to avoid unnecessary requests to nba server. 
 
 ```
 echo "DATA=$(pwd)/data" >> .env
 ```

3) **download and install corrections**
The records provided by the NBA API are unfortunately incomplete and certain records cannot be converted into `GameObjects`. The cause can be a missing field such as personal fouls (PF), no recorded play time (MIN) or missing field goal or free throw attempts. (FTM, FTA). For certain columns there are default ways to handle incomplete records (e.g. defaulting missing personal fouls to 0). For other columns, such as points, manual completions are required and can be completed using the provided interface. (Users are automatically prompted during volume creation)

Default corrections are updated and posted as needed and the corrections through the 2026 playoffs are up-to-date and all boxscores can be transformed into `GameObjects`. While the program does run, the data cleanliness and completeness can be improved. Future additions to the provided list of corrections are always welcome. 

 
4) **Add headers.json file**

Create a header json file in the main project directory with at least these 3 fields. More may be required for different features, but 'User-Agent', 'x-postal-code', and 'Ocp-Apim-Subscription-Key' are always required. The last fields value is left as a exercise to the reader.

An example `headers.json` file should look like:
```
{
	'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
	'x-postal-code': 90015,
	'Ocp-Apim-Subscription-Key': 'XXXXXX_HEX_CODE_KEY_XXXXXX',
}
```

5) **Run test suite or main program** 

From the warheads main directory you can run cargo test to see the full test suite. Any failures found are encouraged to be reported to the issues page. 

To test:
```
cargo test
```

To run:
```
cargo run
```
This will run the program, load the entire history of the nba into a Chronology object and train the Elo rating system for all NBA Players.

Once the ratings are created the program will query the NBA game api for the next 7 days of games.

As of 12/31/2025, elo v1 scores a 62.1% accuracy and a log loss value of 0.640.

## Future (and Current) Developments
WARHeads remains under development and as new features are added this document will be updated to reflect the updates.  


- improved models and predictions
- increased scope of predictions including player props, game over under and spreads
- historical back testing with data via oddsportal
- **specific feature:** adding training up to and forecasting specific dates to see how the model performs historically
