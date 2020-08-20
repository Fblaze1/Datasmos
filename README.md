# Datasmos

A script for performing data analysis and visualisation in the desmos online graphing calculator

## Table of Contents

* [Getting Started](#getting-started)
* [Introduction and Concepts](#introduction-and-concepts)

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
