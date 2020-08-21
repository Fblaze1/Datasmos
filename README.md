# Datasmos

A script for performing data analysis and visualisation in the desmos online graphing calculator

## Table of Contents

* [Getting Started](#getting-started)
* [Introduction and Concepts](#introduction-and-concepts)
* [General usage + Examples](#general-usage--examples)
* [Statistical analysis and data visualisation](#statistical-analysis-and-data-visualisation)
* [DataFrame manipulation](#dataframe-manipulation)

## Getting Started

Open a [new desmos page](https://www.desmos.com/calculator)

[Turn off the axes and gridlines](https://support.desmos.com/hc/en-us/articles/208183566-Hide-and-Show-Grid#:~:text=Team%20Desmos&text=To%20turn%20the%20grid%20off,between%20the%20different%20graph%20papers.) in the desmos grapher

In that page, open the javascript console, which can be done using <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>

Copy the [raw datasmos code](https://raw.githubusercontent.com/Fblaze1/Datasmos/master/datasmos.js)

Paste the code into the console and press <kbd>Enter</kbd> to run it

Enter ``` irisCsv = String.raw`` ``` into the javascript console

Copy the [raw iris dataset CSV text](https://raw.githubusercontent.com/Fblaze1/Datasmos/master/iris.csv)

Paste the text in between the backticks (``` `` ```) in the line you just entered into the console, then press <kbd>Enter</kbd>

Enter the following lines into the console, running each one by pressing <kdb>Enter</kbd>:

* `irisDf = csvToDataFrame(irisCsv)`
* `irisDf.head(5)`
* `irisDf.rename("petal_length","petal length")`
* `irisDf.splot("plot1","species","petal length")`

This will create an interactive barchart that you can customise by dragging the coloured dots on the barchart

To hide the customisation options, [hide the folder](https://support.desmos.com/hc/en-us/articles/204980525-Folders) titled "[plot1] customisation"

![alt text](https://github.com/Fblaze1/Datasmos/blob/master/datasmos%20getting%20started%20demo.gif "Getting Started Demo GIF")

## Introduction and Concepts


The two main things this datasmos does are:
* Implements DataFrame objects as a way of storing and manipulating data much like you would in a spreadsheet, allowing you to do things like create a new column that is the average of two others
* Creates statistical analyses and data visualisations of some of the data in a DataFrame, which is all implemented in desmos so you can easily look under the hood to see the calculations involved in the statistical tests and the expressions involved in setting up visualisations

Datasmos is intended to complement the [existing statistical features](https://support.desmos.com/hc/en-us/articles/360022401451-Statistics) present in desmos, not to replace them. Therefore, to get the most out of datasmos you have to first be able to get the most out of desmos.


### DataFrames

The DataFrame is the fundamental object in datasmos and all the useful functions in datasmos are either methods associated with DataFrames or functions for turning data into DataFrames. DataFrames are an object that can be thought of as a spreadsheet, containing data organised into rows and columns and a header row at the top specifying the unique header of each column.

### Data types

In datasmos the data types are `"categorical"` for any data in a `string` that cannot be coerced to a number and `"continuous"` for data composed of numbers or strings that can be coerced to numbers (using the `Number()` function). Each column in a DataFrame is assigned a data type based on its values, which determines the sorts of plots and statistical analyses with which it is compatible.

### `id`

Another important concept in datasmos is `id`. `id` is an argument in every datasmos function that creates expressions in desmos. In the example in the [Getting Started](#Getting-Started) section, `plot1` is the `id`. It is used to ensure that variable definitions don't clash with other variables already defined in the desmos calculator by adding a subscript to each variable with the `id`. Expressions created using the same `id` will be assumed to be part of the same plot/analysis and will often be defined in terms of each other. Every `id` should be:
* unique - don't use the same `id` to create a new scatterplot as the one you just used to make a barchart
* short - since it's going to be added as a subcript to each variable you don't want it cluttering up your expressions too much
* composed only of letters and numbers - this means no punctuation and **no spaces**

### `plot` and `splot` 

`plot` is a function that takes the arguments `id`, `xColumnHeader` and `yColumnHeader` and attempts to plot the data in the column corresponding to `yColumnHeader` against the data in the column corresponding to `xColumnHeader`. It'll determine appropriate plot type based on the [data types](#Data-types) of each column. If there are no plots compatible with the types of the data, it will throw an error. 

`splot` is like `plot` except in addition to plotting the data it is given, it will also conduct an appropriate statistical test (the s in `splot` is for statistics).

These functions are the most general in datasmos and are useful shortcuts, but they don't give you the fine control that calling specific plot/analysis functions would. For example, the `barchart` function, which these functions both use to generate barcharts if they deem that the appropriate plot type, takes the optional parameters like `barColours` which lets you specify the fill colour of each bar. If you already know you want to plot a barchart and want to tweak it using these optional parameters, use the `barchart` function, not `plot`. That said, there are some features of `splot` that don't make sense as standalone functions, namely the linear regression performed when to `"continuous"` variables are plotted against each other with `splot`, so there are cases in which there is no alternative to `splot`.

## General Usage + Examples

In this section we will use the [iris dataset](#iris.csv) (which you can read about [here](#https://en.wikipedia.org/wiki/Iris_flower_data_set)) in our examples, with `irisCsv` as the variable name for the CSV text and `irisDf` as the variable name for the DataFrame generated from the data. Some optional arguments will be specified unnecessarily just to let you know they're there. Please note that despite the fact that these arguments will be passed as `argumentName = argumentValue`, this is just to tell you what each argument is called, but isn't actually passing a [named argument](https://en.wikipedia.org/wiki/Named_parameter) since JavaScript doesn't support that yet.

### Import data from a CSV

Type ``` irisCsv = String.raw`` ``` into the console, then paste the raw text in between the backticks and run. The `String.raw` tag makes sure the text in the dataset is copied in its original form when it contains backslashes that would otherwise be interpreted as escape characters.

### Convert a CSV string to a DataFrame and override the original column headers

```javascript
irisDf = csvToDataFrame(irisCsv,csvContainsHeaderRow = true, columnHeaders = ["sepal length","sepal width","petal length","petal width","species"], sep = ",")//create a DataFrame from irisCsv and rename the column headers so they have spaces instead of underscores`
```
If `csvContainsHeaderRow` is `true`, the first row of the CSV string is separated from the rest of the data and is either used as the header row for the DataFrame or discarded if overridden by `columnHeaders`. `sep` specifies the separator and, if set to `\t`, allows this function to be used to read TSV text instead of CSV text.

### Display a random sample of a DataFrame in the console

In the [Getting Started](#getting-started) section we saw an example of `head(n)` being used to sample the first `n` rows from the DataFrame. If you want to see a more representative sample of your DataFrame, use `randomHead(n)` to generate `n` rows randomly selected from the entire DataFrame:
```javascript
irisDf.randomHead(10)
```
The `head` and `randomHead` methods use the [`console.table` function](https://developer.mozilla.org/en-US/docs/Web/API/Console/table), a very handy and underappreciated relative of `console.log`.

### Export a DataFrame to CSV or TSV with `toCsv()`

## Statistical analysis and data visualisation

### Make a scatterplot

`scatterplot()`

### Make a barchart

`barchart()`

### Perform an Analysis of Variance

`ANOVA()`
`splot()`

### Make a scatterplot with a line of best fit

`splot()`

## DataFrame properties

Most DataFrame properties can be read but not written to - you can get them but not set them.

### `size`

An array containing the dimensions of the array.
The first item in the array is the number of rows and the second is the number of columns.

### `data`

### `dataRows` 

### `dataColumns`

### `headerRow`

### `headerTypeDict`

### `factorLevelDict`

## DataFrame manipulation

### Make a subset of the DataFrame by applying a condition to its rows

```javascript
irisDfSetosa = irisDf.subsetRows(row=>row["species"]=="setosa")//returns a new DataFrame containing only the rows whose "species" attribute is "setosa"
irisDfSetosa.randomHead()
```
`subsetRows` takes in a condition function as its only argument - the function ahould return a Boolean value (`true` or `false`) for each row to determine whether to include that row in the subset

### Make a subset of the DataFrame by applying a condition to its columns

```javascript
irisDfNumbersOnly = irisDf.subsetColumns(col=>col.every(x=>!isNaN(x)))//returns a new DataFrame containing only the columns whose values can all be coerced to numbers
irisDf.randomHead()
```
`subsetColumns` takes in a condition function as its only argument - the function ahould return a Boolean value (`true` or `false`) for each column to determine whether to include that column in the subset

### Convert `"continuous"` data to `"categorical"`

`df.forceCategorical(header)`
`df.undoForceCategorical(header)`

### Drop a column from a DataFrame

`df.drop(header)`
`df.drop(arrayOfHeaders)`

### Rename a column

`df.rename(oldHeader,newHeader)`

See the [Getting Started](#getting-started) section for an example

### Merge two DataFrames

`df1.merge(df2)`

Alters `df1` but not `df1`. See below for how to create a merged DataFrame without altering the original DataFrames.

### Make a copy of a DataFrame

`clone`

If you want to `merge` two DataFrames but retain the originals, you can use `clone`:
```javascript
df1Clone = df1.clone()
merged = df1Clone.merge(df2)
//df1 and df2 remain unchanged
```

### Split a table based on a categorical variable

`splitByFactor(header)`

Useful for creating plots 
```javascript
irisDfsBySpecies = irisDf.splitByFactor("species")
irisDfsBySpecies.forEach(df=>df.randomHead())
irisDfsBySpecies.forEach((df,i)=>df.splot(`species${irisDf.factorLevelDict["species"][i]}`,"petal length","sepal length"))
```

### Add a row

`addRow`

Can take a list or object as an argument
