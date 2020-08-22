# Datasmos

A script for performing data analysis and visualisation in the desmos online graphing calculator

## Table of Contents

* [Getting Started](#getting-started)
* [Introduction and Concepts](#introduction-and-concepts)
* [General usage + Examples](#general-usage--examples)
* [Statistical analysis and data visualisation](#statistical-analysis-and-data-visualisation)
* [DataFrame properties](#dataframe-properties)
* [Accessing DataFrame columns](#accessing-dataframe-columns)
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

### Create a DataFrame from scratch

You can create a DataFrame without using CSV text with the following syntax: `df = new DataFrame(columnHeaders,dataRows2dArray)`
```javascript
newDf = new DataFrame(
    ["col1","col2","col3"]
    ,
    [
        ["1","cat","0.3"],
        ["2","car","0.75"],
        ["15","cap","0.12"]
    ]
)
newDf.head(3)
```

### Display a random sample of a DataFrame in the console

In the [Getting Started](#getting-started) section we saw an example of `head(n)` being used to sample the first `n` rows from the DataFrame. If you want to see a more representative sample of your DataFrame, use `randomHead(n)` to generate `n` rows randomly selected from the entire DataFrame:
```javascript
irisDf.randomHead(10)
```
The `head` and `randomHead` methods use the [`console.table` function](https://developer.mozilla.org/en-US/docs/Web/API/Console/table), a very handy and underappreciated relative of `console.log`.

### Export a DataFrame to CSV or TSV

Convert to CSV:

`df.toCsv()`

Convert to TSV:

`df.toCsv(sep="\t")`

You can use JavaScript's `copy()` function to copy the output of this function to your clipboard to paste it elsewhere:

`copy(df.toCsv())`

TSV strings can be pasted into spreadsheet software to create a spreadsheet representation of the DataFrame's data
Both CSV strings and TSV strings can be pasted into desmos to create a table representation of the DataFrame's data, but this isn't recommended for particularly large DataFrames and **won't work for DataFrames with non-numerical values**

The output of this function removes the quotes around strings so values of `1` and `"1"` will be represented identically

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

You can access a DataFrame's properties like this `irisDf.size` or like this `irisDf["size"]`

### `size`

`size` is an array containing information about the dimensions of the DataFrame.

The first item in `size` is the number of rows in the DataFrame, and the second item is the number of columns.

```javascript
irisDf.size
//output: [150,5]
```

### `headerRow`

`headerRow` is an array containing the header for each column in the order in which the columns are stored in the DataFrame.

It can be thought of as the header row at the top of a spreadsheet.

```javascript
irisDf.headerRow
//output: ["sepal length", "sepal width", "petal length", "petal width", "species"]
```

### `data`

The `data` property contains the data stored in the DataFrame in a [JSON](https://en.wikipedia.org/wiki/JSON) format - an array of row objects containing both the values in that row and the column headers to which each value corresponds.

```javascript
irisDf.data[42]
//output: {sepal length: "5.1", sepal width: "3.4", petal length: "1.5", petal width: "0.2", species: "setosa"}
```

### `dataRows`

`dataRows` is a representation of `data` in which the information about column headers is removed. 

The resulting data structure is a 2D array where each row corresponds to a row in the DataFrame.

```javascript
irisDf.dataRows[4]
//output: ["5.0", "3.6", "1.4", "0.2", "setosa"]
```

### `dataColumns`

`dataColumns` is a representation of `data` in which the information about column headers is removed. 

The resulting data structure is a 2D array where each row corresponds to a row in the DataFrame.

```javascript
irisDf.dataColumns[4]
//output: ["setosa","setosa","setosa", ...]
```

### `headerTypeDict`

An object/dictionary that contains information about the data type (`"categorical"` or `"continuous"`) of each column

```javascript
irisDf.headerTypeDict["petal length"]
//output: "continuous"

irisDf.headerTypeDict["species"]
//output: "categorical"
```

### `factorLevelDict`

An object/dictionary that contains an array for each factor ( `"categorical"` variable) containing its levels (the set of distinct values that variable can take),

Every column has a corresponding entry in `factorLevelDict` - for `"continuous"` columns, which aren't factors, this entry is an empty array.

```javascript
irisDf.factorLevelDict["species"]
//output: ["setosa", "versicolor", "virginica"]

irisDf.factorLevelDict["petal length"]
//output: []
```

## Accessing DataFrame columns

DataFrame columns can be accessed in the same way as properties:
```javascript
irisDf.species
//output: ["setosa", "setosa", "setosa", ...]

irisDf["petal length"]
//output: ["1.4", "1.4", "1.3", ...]
```

You can get the `levels` of a column as an alternative to looking up that column's entry in `factorLevelDict`:
```javascript
irisDf.species.levels
//output: ["setosa", "versicolor", "virginica"]

irisDf["petal length"].levels
//output: undefined
```
The difference between getting the `levels` property of a column and looking it up in `factorLevelDict` is that for `"continuous"` columns like `petal length`, the `levels` property is `undefined` whereas the corresponding value in `factorLevelDict` is `[]`, an empty array.

You can get the values of multiple columns at a time using an array of column headers:
```javascript
irisDf[["petal length","sepal width","species"]]
output: [["1.4", "1.4", "1.3", ...],["3.5", "3.0", "3.2", ...],["setosa", "setosa", "setosa", ...]]
```

You can also overwrite the values of an existing column or create a new column using this syntax:
```javascript
function arrayAvg(...arrays){
    return [...arrays[0].keys()].map(//iterate through indices of the first array
        i =>
            arrays.map(//get items in each array at index i and coerce them to numbers
                array => Number(array[i])
            )
            .reduce((a,b)=>a+b)//sum all the items at index i
            /arrays.length//divide by the number of arrays to get the average (arithmetic mean)
    )
}
//create new column with header "avg" that is the average 
//the ... is JavaScript's "spread syntax" for spreading out the items in an array to pass each one as a separate argument to a function (it has other uses as well)
irisDf.avg = arrayAvg(...irisDf[["sepal width","sepal length","petal width","petal length"]])
    .map(x=>x.toString())//convert the numbers to strings
irisDf.randomHead()

irisDf["average length"] = arrayAvg(...irisDf[["petal length","sepal length"]])
    .map(x=>x.toString())//convert the numbers to strings
irisDf.randomHead()
```

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

If you have a column that contains numerical values but you want them to be treated as `"categorical"`, not `"continuous"`, you can use the `forceCategorical` method to do just that. To undo this action, use `undoForceCateogrical`.

`df.forceCategorical(header)`
`df.undoForceCategorical(header)`

### Drop a column from a DataFrame

To delete/drop a column from a DataFrame, use the `drop` method. This can't be undone.

`df.drop(header)`

If you want to drop multiple columns at a time, you can pass an array of column headers to the function instead of just one.

```javascript

df = csvToDataFrame(String.raw`col1,col2,col3,col4,col5
1,cat,0.3,55,6
2,car,0.75,66,7
15,cap,0.12,77,8`)

df.head(3)

df.drop("col2")

df.head(3)

df.drop(["col1","col3","col5"])

df.head(3)

```

### Rename a column

If you want to rename a column, maybe because you're about to merge two DataFrames and want to avoid column header clashes, you can use the `rename` method.

`df.rename(oldHeader,newHeader)`

See the [Getting Started](#getting-started) section for an example

### Merge two DataFrames

The `merge` method adds the columns of one DataFrame onto another, while preserving information about whether `forceCategorical` has been called on any of the columns. For two DataFrames to be merged, they must both have the same number of rows.

`df1.merge(df2)`

```javascript
df1 = new DataFrame(
    ["col1","col2","col3"]
    ,
    [
        ["1","cat","0.3"],
        ["2","car","0.75"],
        ["15","cap","0.12"]
    ]
)

df2 = new DataFrame(
    ["col4","col5"]
    ,
    [
        ["55","6"],
        ["66","7"],
        ["77","8"]
    ]
)

df1.merge(df2)
df1.head(3)
```

`merge` alters `df1` but not `df1`. See below for how to create a merged DataFrame without altering the original DataFrames.

### Make a copy of a DataFrame

`clone`

If you want to `merge` two DataFrames but retain the originals, you can use `clone`:
```javascript
df1Clone = df1.clone()
merged = df1Clone.merge(df2)
//df1 and df2 remain unchanged
```

### Split a DataFrame based on a categorical variable

`splitByFactor(header)`

Useful for creating plots 
```javascript
irisDfsBySpecies = irisDf.splitByFactor("species")
irisDfsBySpecies.forEach(df=>df.randomHead())
irisDfsBySpecies.forEach((df,i)=>df.splot(`species${irisDf.factorLevelDict["species"][i]}`,"petal length","sepal length"))
```

### Add a row to a DataFrame

You can insert a new row at any `index` in a DataFrame using the `addRow` method.

The new row can either be an array or values, which must be in the right order, or an object that specifies which column each value belongs to. In that case, the order of the values in the new row object doesn't matter as it will be reordered automatically before being added.

The each value in the new row must match its column's data type, but in the case of `"categorical"` columns the new value doesn't need to be in the current `levels` array for that column - if it is a new, unique value, it will be added to the `factorLevelDict` entry for that column, so there's no need to worry about having to change it beforehand.

The `index` optional argument specifies the position at which to insert the new row. The default value is `-1`, meaning the row will be added to the bottom of the DataFrame. This can be extended by passing `index` a value of `-2` to insert the row at the penultimate position, and so on.

```javascript
irisDf.data.slice(145,irisDf.data.length)
irisDf.addRow(["4.7","2.2","3.6","1.1","wattii"],index=0)//adds row to the top
irisDf.addRow({"species":"wattii","sepal length":"5.9","petal length":"3.9","sepal width":"3.8","petal width":"1.3"})//adds row to the bottom by default
irisDf.head()//demonstrates the newly added row at the top
console.table(irisDf.data.slice(147,152))//demonstrates the newly added row at the bottom
irisDf.species.levels //output: ["wattii", "setosa", "versicolor", "virginica"]
```

## Passing multiple `header` arguments to DataFrame methods

As demonstrated with `drop`, when a DataFrame method takes `header` as its only argument, you can pass it an array of headers instead and the method will be called on each header in that array. 

The methods this applies to currently are: 
* `drop`
* `forceCategorical`
* `undoForceCategorical`