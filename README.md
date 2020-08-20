# Datasmos

A script for performing data analysis and visualisation in the desmos online graphing calculator

## Getting started

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
