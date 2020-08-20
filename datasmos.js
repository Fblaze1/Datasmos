datasmosVersion = "1.0"

{//table manipulation toolkit v1.4.1
//assume the code is being run in a desmos page and the Desmos calculator object is instantiated as Calc 
//use of "Table" in the name of a function indicates that it takes tableId as an argument
//desmos stores values in tables as strings, even if the values are numbers
//WARNING: if you try to perform a function that involves mathematical manipulation of its argument using the applyTo family of functions, do not set requireNumericInput = false (it is true by default) or this could result in NaN outputs which desmos will interpret as N*a*N
//don't set table labels as "x_1", instead name them as "x_{1}", otherwise desmos will convert the labels from the former to the later after the graph has been saved and the page refreshed, meaning, for example, getColumnByLabel("x_1") will work initially after you set that label but not after the you save the graph and access it a second time

//functions that use parameter destructuring and their corresponding optional arguments:
//setTable - columnLabels (array of LaTeX strings), plot (Boolean)
//applyTo - requireNumericInput (Boolean),ignoreNA (Boolean), reportNonNumericInput(Boolean, default = same value as requireNumericInput)
//applyToTableRow - see applyTo
//applyToTableColumn - see applyTo
//applyToColumnByLabel - see applyTo

class desmosTableError extends Error {
//https://javascript.info/custom-errors
  constructor(message) {
    super(message);
    this.name = "desmosTableError";
  }
}

transpose = function(matrix){
	//https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
	  return matrix[0].map((col, index) => matrix.map(row => row[index]))
	}

expressionNumberToId = function(expressionNumber){
	//expression number is the number displayed in the calculator next to an expression
	//columns of tables do have an id but do not have expression numbers
	//expressionNumber-1 is to account for list indexing starting from 0
	return Calc.getExpressions()[expressionNumber-1].id
}

getExpressionIdsOfType = function(targetType){
	expressions = Calc.getExpressions()
	tableIdList = []
	for (expression of expressions){
		if (expression.type == targetType){
			tableIdList.push(expression.id)
		}
	}
	return tableIdList
}

getExpressionById = function(expressionId){ //returns expression object
	//returns the first item in the list of expressions that have the target id
	//desmos enforces id uniqueness so the first item will also be the only item
	expression = Calc.getExpressions().filter(e => e.id == expressionId)[0]
	if (expression)return expression
	else throw new desmosTableError(`expression with id "${expressionId}" not found`)
}

getTableColumns = function(tableId){
	//each column in a table has an id (string), label (LaTeX string) and values list
	//this function extracts only the values of each column and returns them as a 2D array
	//throws an error if the target expression is not a table or does not exist
	expression = getExpressionById(tableId)
	if (expression.type == "table"){
		numColumns = expression.columns.length
		outputMatrix = []
		for (i = 0; i < numColumns; i++){
			columnValues = expression.columns[i].values
			outputMatrix.push(columnValues)
		}
		return outputMatrix
	}
	else throw new desmosTableError(`there is no table with id "${tableId}"`)
}

getTableColumnLabels = function(tableId){
	//each column in a table has an id (string), label (LaTeX string) and values list
	//this function extracts only the labels of each column and returns them as an array
	//throws an error if the target expression is not a table or does not exist
	expression = getExpressionById(tableId)
	if (expression.type == "table")return expression.columns.map(column => column.latex)
	else throw new desmosTableError(`expression with id ${tableId} is not a table`)
}

getTableRows = function(tableId){
	return transpose(getTableColumns(tableId))
}

setTable = function(tableId, columnValues, {columnLabels=undefined, plot = true}={}){
	//tableId : string, should either be a unique id or one shared with the table you wish to overwrite
	//setting tableId to the id of an expression that isn't a table will result in an error
	//columnValues : list of lists of LaTeX strings or numerical values e.g. [[1,2,3],[4,"a",6],[7,8,"\\sin\\left(\\pi\\right)"]]
	//columnLabels : list of LaTeX strings, must be the same length as columnValues, default=undefined
	//if the table already exists and is being overwritten, it will retain its previous properties that aren't overwritten
	//including column labels if the columnLabels argument is not specified
	tableExpression = {id:tableId,type:"table"}
	numColumns = columnValues.length
	columnsList = []
	for ( i = 0; i < numColumns; i++){
		columnExpression = {}
		columnId = tableId + "Column" + i.toString()
		columnExpression.id = columnId
		columnExpression.values = columnValues[i]
		columnExpression.hidden = !plot
		columnsList.push(columnExpression)
		if (columnLabels) columnExpression.latex = columnLabels[i]
	}
	tableExpression.columns = columnsList
	Calc.setExpression(tableExpression)	
}

{//notes about the array.splice() method
//it handles indices outside the range of the array by doing nothing instead of throwing an error
//it handles negative indices by moving backwards from the end of a list
//a = [1,2,3,4,5]
//a.splice(-1,deleteCount = 1,"*") removes 1 item from the last position and puts "*" in its place
//a becomes [1,2,3,4,"*"]
//if instead deleteCount had been set to 0, "*" would still have been inserted into the last index of the *original* array, not the new array
//so a.splice(-1,deleteCount=0,"*") will result in a=[1,2,3,4,"*",5] and not a=[1,2,3,4,5,"*"]
//a.splice(a.length,deleteCount=0,"*") is the only way to add an item to the end of an array using the .splice() method
}

addTableRow = function(tableId,rowValues,index=-1){
	columns = getTableColumns(tableId)
	numColumns = columns.length
	if (numColumns == rowValues.length){
		if (index < 0){
			columnLength = columns[0].length//all columns in a desmos table have the same length (unless tampered with using the API)
			index = columnLength+1+index //the +1 is to make .splice() work as one would expect
		}
		columns.map((column,i) => column.splice(index,deleteCount = 0, rowValues[i]))
		setTable(tableId,columns)	
	}
	else throw new desmosTableError(`length of row (${rowValues.length})does not match number of columns in target table (${numColumns})`)
}

removeTableRow = function(tableId,index=-1){
	columns = getTableColumns(tableId)
	columns.map(column => column.splice(index,1))//splice alters the columns matrix upon which it acts
	setTable(tableId,columns)
}

addTableColumn = function(tableId,columnLabel,columnValues,index=-1){
	columns = getTableColumns(tableId)
	labels = getTableColumnLabels(tableId)
	if (index < 0){
		columnLength = columns[0].length//all columns in a desmos table have the same length (unless tampered with using the API)
		index = columnLength+1+index //the +1 is to make .splice() work as one would expect
	}
	columns.splice(index,deleteCount = 0, columnValues)
	labels.splice(index, deleteCount = 0, columnLabel)
	setTable(tableId,columns,{columnLabels : labels})
}

removeTableColumn = function(tableId, index=-1){
	columns = getTableColumns(tableId)
	labels = getTableColumnLabels(tableId)
	columns.splice(index,deleteCount = 1)
	labels.splice(index,deleteCount = 1)
	setTable(tableId,columns,{columnLabels : labels})
}

updateTableRow = function(tableId,newRowValues,index){
	columns = getTableColumns(tableId)
	numColumns = columns.length
	if (numColumns == newRowValues.length){
		if (index < 0){
			columnLength = columns[0].length//all columns in a desmos table have the same length (unless tampered with using the API)
			index = columnLength+1+index //the +1 is to make .splice() work as one would expect
		}
		columns.map((column,i) => column.splice(index,deleteCount = 1, newRowValues[i]))
		setTable(tableId,columns)
	}
	else throw new desmosTableError(`length of updated row (${newRowValues.length}) does not match number of columns in target table (${numColumns})`)
}

updateTableColumn = function(tableId,newColumnValues,index){
	columns = getTableColumns(tableId)
	labels = getTableColumnLabels(tableId)
	columns.splice(index,deleteCount = 1,newColumnValues)
	setTable(tableId,columns)
}

{//notes about the applyTo family of functions
//applyTo() doesn't alter the original array it is given, instead returning a modified copy of it
//applyToColumnByLabel(), applyToTableColumn() and applyToTableRow(), which depend on applyTo(), all alter the table column with the target label passed to them as an argument and have no return value
//all three above functions will throw an error if given an invalid tableId, index or targetColumnLabel
}

applyTo = function(array,func,{requireNumericInput = true,ignoreNA = true,reportNonNumericInput = "default"}={}){//reportNonNumericInput="default" sets it to have the same value as requireNumericInput
	if (reportNonNumericInput=="default")reportNonNumericInput = requireNumericInput
	if (requireNumericInput){ 
		oldFunc = func
		func = function(x,i){
			if (ignoreNA && x=="") return ""
			else{
				if (isNaN(Number(x))){
					if (reportNonNumericInput) console.log(`Item at index ${i} with value ${x} is not a number`)
					return x
				}
				else return oldFunc(Number(x))
			}
		}
	}
	return array.map((x,i) => func(x,i))
}

applyToTableRow = function(tableId,func,index,{requireNumericInput = true,ignoreNA = true,reportNonNumericInput = "default"}={}){
	opts = {requireNumericInput:requireNumericInput,ignoreNA:ignoreNA,reportNonNumericInput:reportNonNumericInput}
	row = getTableRows(tableId)[index]
	newRowValues = applyTo(row,func,opts)
	updateTableRow(tableId,newRowValues,index)
}

applyToTableColumn = function(tableId,func,index,{requireNumericInput = true,ignoreNA = true,reportNonNumericInput = "default"}={}){
	opts = {requireNumericInput:requireNumericInput,ignoreNA:ignoreNA,reportNonNumericInput:reportNonNumericInput}
	column = getTableColumns(tableId)[index]
	newColumnValues = applyTo(column,func,opts)
	updateTableColumn(tableId,newColumnValues,index)
}

getColumnByLabel = function(targetColumnLabel){//targetColumnLabel: LaTeX string
	// returns the values of the first table column whose label matches the target labels
	// table column labels should be unique for desmos to work properly but this uniqueness is not enforced
	tableIds = getExpressionIdsOfType("table")
	for (i = 0; i < tableIds.length; i++){//iterate through each table
		tableExpression = getExpressionById(tableIds[i])
		numColumns = tableExpression.columns.length
		for (j = 0; j < numColumns; j++){//iterate through each column of the current table
			columnExpression = tableExpression.columns[j]
			if( columnExpression.latex == targetColumnLabel){//if the label of the current column matches the target label, return its values
				return columnExpression.values
			}
		}
	}
	throw new desmosTableError(`column with target label "${targetColumnLabel}" not found`)
}

applyToColumnByLabel = function(targetColumnLabel,func,{requireNumericInput = true,ignoreNA = true,reportNonNumericInput = "default"}={}){//targetColumnLabel: LaTeX string
	opts = {requireNumericInput:requireNumericInput,ignoreNA:ignoreNA,reportNonNumericInput:reportNonNumericInput}
	tableIds = getExpressionIdsOfType("table")
	for (i = 0; i < tableIds.length; i++){//iterate through each table
		columns = getExpressionById(tableIds[i]).columns
		for (columnIndex in columns){//iterate through each column of the current table
			if( columns[columnIndex].latex == targetColumnLabel){//if the label of the current column matches the target label, apply the function to the column
				newColumnValues = applyTo(columns[columnIndex].values,func,opts)
				columns[columnIndex].values = newColumnValues
				Calc.setExpression({id:tableIds[i],type:"table",columns:columns})
				return
			}
		}
	}
	throw new desmosTableError(`column with target label "${targetColumnLabel}" not found`)
}

removeColumnByLabel = function(targetColumnLabel){//targetColumnLabel: LaTeX string
	tableIds = getExpressionIdsOfType("table")
	for (i = 0; i < tableIds.length; i++){//iterate through each table
		columns = getExpressionById(tableIds[i]).columns
		for (columnIndex in columns){//iterate through each column of the current table
			if( columns[columnIndex].latex == targetColumnLabel){//if the label of the current column matches the target label, remove the column
				removeTableColumn(tableId,columnIndex)
				return
			}
		}
	}
	throw new desmosTableError(`column with target label "${targetColumnLabel}" not found`)
}

updateColumnByLabel = function(targetColumnLabel,newColumnValues){//targetColumnLabel: LaTeX string
	tableIds = getExpressionIdsOfType("table")
	for (i = 0; i < tableIds.length; i++){//iterate through each table
		columns = getExpressionById(tableIds[i]).columns
		for (columnIndex in columns){//iterate through each column of the current table
			if( columns[columnIndex].latex == targetColumnLabel){//if the label of the current column matches the target label, update the column with the new values
				columns[columnIndex].values = newColumnValues
				Calc.setExpression({id:tableIds[i],type:"table",columns:columns})
				return
			}
		}
	}
	throw new desmosTableError(`column with target label "${targetColumnLabel}" not found`)
}

printTable = function(tableId){//prints "2.72" as 2.72 and "e" as "e"
	matrixToString = function(matrix){
		outputString = "["
		for (row of matrix){
			rowString = "["
				for (item of row){
					itemAsNumber = Number(item)
					if (isNaN(itemAsNumber))itemString = '"'+item.toString()+'"'
					else itemString = item.toString()
					rowString = rowString + itemString + ","
				}
				rowString = rowString.slice(0,-1)//remove extra comma at the end
				rowString = rowString+"]"
			outputString = outputString + rowString + ","
		}
		outputString = outputString.slice(0,-1)//remove extra comma at the end
		outputString = outputString+"]"
		return outputString
	}
	console.log(matrixToString(getTableRows(tableId)))
}

}

/* 
csv = String.raw``//paste your csv text in between the backticks
*/

csvTo2dArray = function(csv, sep = ',') {
    rowRegExp = /^.+$/gm//this regular expression searches for all the lines in the csv string that contain one or more characters
    colRegExp = new RegExp(String.raw`[^${sep}\n\r]+?(?=${sep}|$)`, 'gm')//this regular expression searches for the shortest possible strings that don't contain separator (sep) or newline characters and are followed by a separator or are at the end of the line
    rowStringArray = csv.match(rowRegExp)
	rowColumn2dArray = rowStringArray.map(rowString=>rowString.match(colRegExp))
    return rowColumn2dArray
}

arraysEqual = function(arr1,arr2){//test if two arrays are equal
	return (arr1.length==arr2.length && arr1.every((x,i)=>x===arr2[i]))
}

isCategorical = function(dataArray){
    return Boolean(dataArray.find(x=>isNaN(x)))
}

class DataFrameError extends Error{
	constructor(message) {
    super(message)
    this.name = "DataFrameError"
  }
}

class DesmosIdError extends Error{
	constructor(message) {
    super(message)
    this.name = "DesmosIdError"
  }
}

generateDataExpressionsCategoricalByContinuous = function(id,levels,xCategoricalData,yContinuousData){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	//ensure levels,xCategoricalData and yCategoricalData inputs are the correct types
	if (!(levels instanceof Array) || levels.some(x=>typeof(x)!="string")) throw new Error(`levels must be an array of strings`)
	if (!(xCategoricalData instanceof Array) || xCategoricalData.some(x=>typeof(x)!="string")) throw new Error(`xCategoricalData must be an array of strings`)
	//allow yContinuousData to be given as array of numbers or numbers as strings 
	if (!(yContinuousData instanceof Array) || (yContinuousData.some(x=>isNaN(x)))) throw new Error(`yContinuousData must be an array of numbers or numbers as strings`)
	yContinuousData = yContinuousData.map(x=>x.toString())

	levelExpressions = [
		{
			type: `expression`,
			id: `${id} data level list`,
			folderId: `${id} data folder`,
			color: `#000000`,
			latex: `l_{${id}}=\\left[`+
					levels.map(level=>
						`l_{${level}${id}}`
					).join(",")
				+`\\right]`
		},
		...levels.map((level,i)=>
			({
				type: `expression`,
				id: `${id} data level value ${1+Number(i)}`,
				folderId: `${id} data folder`,
				color: `#000000`,
				latex: `l_{${level}${id}}=${0.5+Number(i)}`
			})
		)
	]
	
	dataTableExpression = {
			id: `${id} data table`,
			type: `table`,
			folderId: `${id} data folder`,
			columns: [
				{
					values: xCategoricalData.map(x=>`l_{${x}${id}}`),
					hidden: true,
					id: `${id} data table column 0`,
					color: `#003b6f`,
					latex: `x_{data${id}}`
				},
				{
					values: yContinuousData,
					hidden: true,
					id: `${id} barchart1DataTableColumn1`,
					color: `#003b6f`,
					latex: `y_{data${id}}`
				}
			]
		}
	
	dataExpressions = [
		{
			type: `folder`,
			id: `${id} data folder`,
			title: `[${id}] data`,
			collapsed: true
		},
		{
			type: `text`,
			id: `${id} data text levels`,
			folderId: `${id} data folder`,
			text: `levels`
		},
		...levelExpressions,
		dataTableExpression,
		{
			type: `folder`,
			id: `${id} grouped data summary statistics folder`,
			title: `[${id}] grouped data summary statistics`,
			collapsed: true
		},
		{
			id: `${id} grouped data summary statistics table`,
			type: `table`,
			folderId: `${id} grouped data summary statistics folder`,
			columns: [
				{
					values: levels.map(level=>`l_{${level}${id}}`),
					hidden: true,
					id: `${id} grouped data summary statistics table column 0`,
					color: `#003b6f`,
					latex: `l_{evels${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 1`,
					color: `#003b6f`,
					latex: `N_{g${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 2`,
					color: `#003b6f`,
					latex: `M_{g${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 3`,
					color: `#003b6f`,
					latex: `S_{SPerGroup${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 4`,
					color: `#003b6f`,
					latex: `S_{D${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 5`,
					color: `#003b6f`,
					latex: `S_{EM${id}}`
				},
				{
					values: levels.map(level=>``),
					hidden: true,
					id: `${id} grouped data summary statistics table column 6`,
					color: `#003b6f`,
					latex: `C_{I95${id}}`
				}
			]
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text number of groups`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `number of groups`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics number of groups`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#388c46`,
			latex: `k_{${id}}=\\operatorname{length}\\left(l_{${id}}\\right)`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text group sizes`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `group sizes`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics group sizes`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#000000`,
			latex: `N_{g${id}}=\\left[`+
					levels.map((level,i)=>
						`\\operatorname{length}\\left(y_{data${id}}\\left[x_{data${id}}=l_{${id}}\\left[${1+Number(i)}\\right]\\right]\\right)`
					).join(",")
				+`\\right]`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text group means`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `group means`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics group means`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#388c46`,
			latex: `M_{g${id}}=\\left[`+
					levels.map((level,i)=>
						`\\operatorname{mean}\\left(y_{data${id}}\\left[x_{data${id}}=l_{${id}}\\left[${1+Number(i)}\\right]\\right]\\right)`
					).join(",")
				+`\\right]`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text total number of observations (N)`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `total number of observations (N)`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics total number of observations (N)`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#6042a6`,
			latex: `N_{Total${id}}=\\operatorname{length}\\left(y_{data${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics function s_{umSquares${id}}`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#388c46`,
			latex: `S_{umSquares${id}}\\left(x\\right)=\\sum_{i_{${id}}=1}^{\\operatorname{length}\\left(x\\right)}\\left(x\\left[i_{${id}}\\right]-\\operatorname{mean}\\left(x\\right)\\right)^{2}`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text sum of squares per group`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `sum of squares per group`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics sum of squares per group list`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#2d70b3`,
			latex: `S_{SPerGroup${id}}=\\left[S_{umSquares${id}}\\left(y_{data${id}}\\left[x_{data${id}}=l_{${id}}\\left[1\\right]\\right]\\right),S_{umSquares${id}}\\left(y_{data${id}}\\left[x_{data${id}}=l_{${id}}\\left[2\\right]\\right]\\right),S_{umSquares${id}}\\left(y_{data${id}}\\left[x_{data${id}}=l_{${id}}\\left[3\\right]\\right]\\right)\\right]`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text standard deviation`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `standard deviation`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics standard deviation`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#c74440`,
			latex: `S_{D${id}}=\\sqrt{\\frac{S_{SPerGroup${id}}}{N_{g${id}}-1}}`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text standard error of the mean`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `standard error of the mean`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics standard error of the mean`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#c74440`,
			latex: `S_{EM${id}}=\\frac{S_{D${id}}}{\\sqrt{N_{g${id}}}}`
		},
		{
			type: `text`,
			id: `${id} grouped data summary statistics text 95% confidence intervals`,
			folderId: `${id} grouped data summary statistics folder`,
			text: `95% confidence intervals`
		},
		{
			type: `expression`,
			id: `${id} grouped data summary statistics 95% confidence intervals`,
			folderId: `${id} grouped data summary statistics folder`,
			color: `#388c46`,
			latex: `C_{I95${id}}=S_{EM${id}}\\cdot\\operatorname{tdist}\\left(N_{g${id}}\\right).\\operatorname{inversecdf}\\left(0.95\\right)`
		}
	]
	return dataExpressions
}
	
generateBarchartExpressionsCategoricalByContinuous = function(id,levels,xTitle,yTitle,barColours = "default",barOutlineColours = "default"){//barColours & barOutlineColours : arrays of hex colour strings, equal in length to levels
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	//ensure levels,xTitle,yTitle,barColours and barOutlineColours inputs are the correct types
	if (!(levels instanceof Array) || levels.some(x=>typeof(x)!="string")) throw new Error(`levels must be an array of strings`)
	if (typeof(xTitle) != "string") throw new Error(`xTitle must be a string`)
	if (typeof(yTitle) != "string") throw new Error(`yTitle must be a string`)
	if ((barColours != "default") && (!(barColours instanceof Array) || barColours.some(x=>typeof(x)!="string") || barColours.length != levels.length)) throw new Error(`barColours must either be "default" or an array of strings equal in length to the levels array`)
	if ((barOutlineColours != "default") && (!(barOutlineColours instanceof Array) || barOutlineColours.some(x=>typeof(x)!="string") || barOutlineColours.length != levels.length)) throw new Error(`barOutlineColours must either be "default" or an array of strings equal in length to the levels array`)
	if (barColours == "default") barColours = Array(levels.length).fill("#999999")
	if (barOutlineColours == "default") barOutlineColours = Array(levels.length).fill("#000000")
	defaultValues = {
		"s_{0}":0,//x-offset
		"s_{1}":1,//x-stretch
		"s_{2}":1,//gap
		"s_{3}":0,//y-offset
		"s_{4}":1,//y-stretch
		"s_{5x}":0,//x axis extension
		"s_{5y}":0,//y axis extension
		"n_{5y}":0,//integer version of s_{5y} except while s_{5y} is the relative proportion by which the y axis is extended, n_{5y} is an absolute integer amount
		"s_{6}":0, //x-offset of first bar from origin
		"n_{y}":5,//number of marks on the y-axis
		"i_{ntegerLockYScale}":1,//toggle whether maximum value on y axis must be an integer or can be continuous
		"s_{howx}":1,//toggle whether or not to show x axis labels
		"s_{howvals}":0,//toggle whether or not to show y values above each bar
		"s_{howExtraCustomisation}":0,//toggle whether or not to show extra customisation options
		"s_{howYTickmarks}":1,//toggle whether or not to show y axis tickmarks
		"e_{rrorBarType}":1,//error bar type - 0: none, 1: 95% confidence intervals, 2: Standard Error of the Mean (SEM), 3: Standard Deviation
		"e_{rrorBarWidth}":0.2,//error bar width
		"n_{umErrorBarTypes}":3,//number of available error bar types - lower this value to 2 to exclude Standard Deviation (SD) error bar type, 1 to exclude SEM and SD
		"s_{howMajorYGridlines}":1,//toggle whether or not to show major y gridlines
		"s_{howMinorYGridlines}":0,//toggle whether or not to show minor y gridlines
		"m_{inorGridlineDensity}":5,//number of minor y gridlines per major y gridline
		"b_{arOpacity}":1//opacity of bars - affects both the strength of the colour and the extent to which the gridlines can be seen through the bars
	}


	barExpressions = levels.map((level,i)=>
		({
			type: `expression`,
			id: `${id} barchart setup bar ${1+Number(i)}`,
			folderId: `${id} barchart setup folder`,
			color: barColours[i],
			latex: `\\operatorname{polygon}\\left(r_{ect${id}}\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}\\left[${1+Number(i)}\\right]-\\frac{s_{2${id}}s_{1${id}}}{2},s_{3${id}},s_{2${id}}s_{1${id}},s_{4${id}}M_{g${id}}\\left[${1+Number(i)}\\right]\\right)\\right)`,
			fill: true,
			fillOpacity: `b_{arOpacity${id}}`
		})
	)
	barOutlineExpressions = levels.map((level,i)=>
			({
				type: `expression`,
				id: `${id} barchart setup bar outline ${1+Number(i)}`,
				folderId: `${id} barchart setup folder`,
				color: barOutlineColours[i],
				latex: `\\operatorname{polygon}\\left(r_{ect${id}}\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}\\left[${1+Number(i)}\\right]-\\frac{s_{2${id}}s_{1${id}}}{2},s_{3${id}},s_{2${id}}s_{1${id}},s_{4${id}}M_{g${id}}\\left[${1+Number(i)}\\right]\\right)\\right)`,
				fill: false,
				fillOpacity: `b_{arOpacity${id}}`
			})
	)
	
	
	xLabelExpressions = levels.map((level,i)=>
		({
			type: `expression`,
			id: `${id} barchart setup x label ${1+Number(i)}`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}\\left[${1+Number(i)}\\right],s_{3${id}}\\right)\\left\\{s_{howx${id}}=1\\right\\}`,
			showLabel: true,
			label: levels[i],
			hidden: true,
			labelOrientation: `below`
		})
	),
	
	barchartExpressions = [
		{
			type: `folder`,
			id: `${id} customisation folder`,
			title: `[${id}] customisation`,
			collapsed: true
		},
		{
			type: `expression`,
			id: `${id} customisation value s_{how extra customisation}`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `s_{howExtraCustomisation${id}}=${defaultValues["s_{howExtraCustomisation}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} customisation show extra customisation slider dot`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+1.1S_{x${id}},s_{3${id}}+0.25s_{4${id}}\\left(1+s_{5y${id}}\\right)\\max\\left(M_{g${id}}\\right)+0.5s_{4${id}}\\max\\left(M_{g${id}}\\right)s_{howExtraCustomisation${id}}\\right)`,
			showLabel: true,
			label: `show extra customisation off/on`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `right`
		},
		{
			type: `expression`,
			id: `${id} customisation show extra customisation slider line`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+1.1S_{x${id}},s_{3${id}}+0.25s_{4${id}}\\left(1+s_{5y${id}}\\right)\\max\\left(M_{g${id}}\\right)+0.5s_{4${id}}\\max\\left(M_{g${id}}\\right)t\\right)`
		},
		{
			type: `expression`,
			id: `${id} customisation axes offset`,
			folderId: `${id} customisation folder`,
			color: `#6042a6`,
			latex: `\\left(s_{0${id}},s_{3${id}}\\right)`,
			showLabel: true,
			label: `axes offset`,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} customisation offset from x axis`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+s_{1${id}}s_{6${id}},s_{3${id}}+s_{4${id}}M_{g${id}}\\left[1\\right]\\right)`,
			showLabel: true,
			label: `offset from x-axis`,
			dragMode: `X`,
			labelSize: `small`
		},
		{
			type: `expression`,
			id: `${id} customisation y stretch`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(s_{0${id}},s_{3${id}}+\\frac{2}{3}s_{4${id}}\\max\\left(M_{g${id}}\\right)\\right)`,
			showLabel: true,
			label: `y-stretch`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} customisation x stretch`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(s_{0${id}}+0\\right)+\\left(\\frac{2}{3}s_{6${id}}+\\frac{2}{3}k_{${id}}+\\frac{2}{3}s_{5x${id}}\\right)s_{1${id}},s_{3${id}}\\right)`,
			showLabel: true,
			label: `x-stretch`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `below`
		},
		{
			type: `expression`,
			id: `${id} customisation gap`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}\\left[1\\right]+\\frac{s_{2${id}}s_{1${id}}}{2},s_{3${id}}+0.5s_{4${id}}M_{g${id}}\\left[1\\right]\\right)`,
			showLabel: true,
			label: `gap`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} customisation x axis extension`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}\\left(\\max\\left(l_{${id}}\\right)+0.5\\right)+s_{5x${id}}s_{1${id}},s_{3${id}}\\right)`,
			showLabel: true,
			label: `x axis extension`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `right`
		},
		{
			type: `expression`,
			id: `${id} customisation y axis extension (continuous)`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)\\left(\\sqrt{0-i_{ntegerLockYScale${id}}}+1\\right)s_{0${id}},s_{3${id}}+s_{4${id}}\\max\\left(M_{g${id}}\\right)+s_{5y${id}}s_{4${id}}\\max\\left(M_{g${id}}\\right)\\right)`,
			showLabel: true,
			label: `y axis extension (continuous)`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} customisation y axis extension (integer locked)`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)\\left(\\sqrt{i_{ntegerLockYScale${id}}-1}+1\\right)s_{0${id}},s_{3${id}}+\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)s_{4${id}}+s_{4${id}}n_{5y${id}}\\right)`,
			showLabel: true,
			label: `y axis extension (integer locked)`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} customisation y axis (continuous) dotted line`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}\\left(\\max\\left(l_{${id}}\\right)+0.5\\right)+s_{5x${id}}s_{1${id}},s_{3${id}}+\\left(s_{4${id}}\\max\\left(M_{g${id}}\\right)+s_{5y${id}}s_{4${id}}\\max\\left(M_{g${id}}\\right)\\right)t\\right)`,
			lineStyle: `DOTTED`
		},
		{
			type: `expression`,
			id: `${id} customisation y axis (integer locked) dashed line`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}\\left(\\max\\left(l_{${id}}\\right)+0.5\\right)+s_{5x${id}}s_{1${id}},s_{3${id}}+s_{4${id}}\\left(\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)+n_{5y${id}}\\right)t\\right)`,
			lineStyle: `DASHED`
		},
		{
			type: `expression`,
			id: `${id} customisation x axis (continuous y axis) dotted line`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+\\left(s_{1${id}}s_{6${id}}+s_{1${id}}\\left(\\max\\left(l_{${id}}\\right)+0.5\\right)+s_{5x${id}}s_{1${id}}\\right)t,s_{3${id}}+s_{4${id}}\\max\\left(M_{g${id}}\\right)+s_{5y${id}}s_{4${id}}\\max\\left(M_{g${id}}\\right)\\right)`,
			lineStyle: `DOTTED`
		},
		{
			type: `expression`,
			id: `${id} customisation x axis (integer locked y axis) dashed line`,
			folderId: `${id} customisation folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+\\left(s_{1${id}}s_{6${id}}+s_{1${id}}\\left(\\max\\left(l_{${id}}\\right)+0.5\\right)+s_{5x${id}}s_{1${id}}\\right)t,s_{3${id}}+s_{4${id}}\\left(\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)+n_{5y${id}}\\right)\\right)`,
			lineStyle: `DASHED`
		},
		{
			type: `expression`,
			id: `${id} customisation number of y axis marks`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}-0.4S_{x${id}},s_{3${id}}+\\left(2\\cdot5\\right)^{-1}s_{4${id}}\\max\\left(M_{g${id}}\\right)n_{y${id}}\\right)`,
			showLabel: true,
			label: `Number of y axis marks = \${n_{y${id}}}`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`,
			verticalLabel: true
		},
		{
			type: `expression`,
			id: `${id} customisation integer lock toggle slider dot`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}-0.6S_{x${id}},s_{3${id}}+s_{4${id}}\\max\\left(M_{g${id}}\\right)i_{ntegerLockYScale${id}}\\right)`,
			showLabel: true,
			label: `Integer max y axis lock off/on`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`,
			verticalLabel: true
		},
		{
			type: `expression`,
			id: `${id} customisation integer lock toggle slider line`,
			folderId: `${id} customisation folder`,
			color: `#c74440`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}-0.6S_{x${id}},s_{3${id}}+s_{4${id}}\\max\\left(M_{g${id}}\\right)t\\right)`,
			dragMode: `Y`,
			labelSize: `small`,
			labelOrientation: `left`,
			verticalLabel: true
		},
		{
			type: `expression`,
			id: `${id} customisation show or hide x axis labels slider dot`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}\\cdot\\left(0.25+0.5s_{howx${id}}\\right),s_{3${id}}-0.45S_{y${id}}\\right)`,
			showLabel: true,
			label: `show/hide x axis labels`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `below`
		},
		{
			type: `expression`,
			id: `${id} customisation show or hide x axis labels slider line`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}\\cdot\\left(0.25+0.5t\\right),s_{3${id}}-0.45S_{y${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} customisation show or hide value labels slider dot`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}\\cdot\\left(0.25+0.5s_{howvals${id}}\\right),s_{3${id}}-0.7S_{y${id}}\\right)`,
			showLabel: true,
			label: `show/hide value labels`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `below`
		},
		{
			type: `expression`,
			id: `${id} customisation show or hide value labels slider line`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}\\cdot\\left(0.25+0.5t\\right),s_{3${id}}-0.7S_{y${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar width`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}\\left[1\\right]-s_{1${id}}\\left(\\frac{e_{rrorBarWidth${id}}}{2}\\right),e_{rrorBarLength${id}}\\left[1\\right]+s_{3${id}}+s_{4${id}}M_{g${id}}\\left[1\\right]\\right)`,
			showLabel: true,
			label: `error bar width`,
			dragMode: `X`,
			labelSize: `small`,
			labelOrientation: `left`,
			verticalLabel: true
		},
		{
			type: `expression`,
			id: `${id} customisation label error bar type`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.3\\right),\\max\\left(a_{y${id}}\\right)+0.3S_{y${id}}\\right)`,
			showLabel: true,
			label: `error bar type`,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `small`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type slider line`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6t\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type label none`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6\\frac{0}{n_{umErrorBarTypes${id}}}\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`,
			showLabel: true,
			label: `none`,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `small`,
			labelOrientation: `above`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type label grouped data summary statistics 95% confidence intervals% CI`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6\\frac{1}{n_{umErrorBarTypes${id}}}\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`,
			showLabel: true,
			label: `95% CI`,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `small`,
			labelOrientation: `above`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type label SEM`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6\\frac{2}{n_{umErrorBarTypes${id}}}\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`,
			showLabel: true,
			label: `SEM`,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `small`,
			labelOrientation: `above`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type label SD`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6\\frac{3}{n_{umErrorBarTypes${id}}}\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`,
			showLabel: true,
			label: `SD`,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `small`,
			labelOrientation: `above`
		},
		{
			type: `expression`,
			id: `${id} customisation error bar type slider dot`,
			folderId: `${id} customisation folder`,
			color: `#2d70b3`,
			latex: `\\left(s_{0${id}}+S_{x${id}}\\cdot\\left(0.2+0.6\\frac{e_{rrorBarType${id}}}{n_{umErrorBarTypes${id}}}\\right),\\max\\left(a_{y${id}}\\right)+0.1S_{y${id}}\\right)`,
			dragMode: `XY`,
			labelSize: `small`
		},
		{
			type: `folder`,
			id: `${id} barchart setup folder`,
			title: `[${id}] barchart setup`,
			collapsed: true
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{howYTickmarks}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `s_{howYTickmarks${id}}=${defaultValues["s_{howYTickmarks}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{howMajorYGridlines${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `s_{howMajorYGridlines${id}}=${defaultValues["s_{howMajorYGridlines}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{howMinorYGridlines${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `s_{howMinorYGridlines${id}}=${defaultValues["s_{howMinorYGridlines}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup value m_{inorGridlineDensity${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `m_{inorGridlineDensity${id}}=${defaultValues["m_{inorGridlineDensity}"]}`,
			slider: {
				hardMin: true,
				min: `0`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup value b_{arOpacity${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#2d70b3`,
			latex: `b_{arOpacity${id}}=${defaultValues["b_{arOpacity}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text major y gridlines`,
			folderId: `${id} barchart setup folder`,
			text: `major y gridlines`
		},
		{
			type: `expression`,
			id: `${id} barchart setup major y gridlines`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howMajorYGridlines${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}t,a_{y${id}}\\right)`,
			lineWidth: `0.4`
		},
		{
			type: `text`,
			id: `${id} barchart setup text minor y gridlines`,
			folderId: `${id} barchart setup folder`,
			text: `minor y gridlines`
		},
		{
			type: `expression`,
			id: `${id} barchart setup minor y gridlines`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howMinorYGridlines${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}t,\\left\\{i_{ntegerLockYScale${id}}=0:s_{3${id}}+\\left(1+s_{5y${id}}\\right)s_{4${id}}\\max\\left(M_{g${id}}\\right)\\cdot\\left[0,\\frac{1}{m_{inorGridlineDensity${id}}n_{y${id}}}...1\\right],i_{ntegerLockYScale${id}}=1:s_{3${id}}+s_{4${id}}\\left(\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)+n_{5y${id}}\\right)\\cdot\\left[0,\\frac{1}{m_{inorGridlineDensity${id}}n_{y${id}}}...1\\right]\\right\\}\\right)`,
			lineWidth: `0.2`
		},
		{
			type: `text`,
			id: `${id} barchart setup text bars`,
			folderId: `${id} barchart setup folder`,
			text: `bars`
		},
		...barExpressions,
		{
			type: `text`,
			id: `${id} barchart setup text bar outlines`,
			folderId: `${id} barchart setup folder`,
			text: `bar outlines`
		},
		...barOutlineExpressions,
		{
			type: `expression`,
			id: `${id} barchart setup rectangle points generator`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `r_{ect${id}}\\left(x_{0arg${id}},y_{0arg${id}},w_{arg${id}},h_{arg${id}}\\right)=\\left[\\left(x_{0arg${id}},y_{0arg${id}}\\right),\\left(x_{0arg${id}}+w_{arg${id}},y_{0arg${id}}\\right),\\left(x_{0arg${id}}+w_{arg${id}},y_{0arg${id}}+h_{arg${id}}\\right),\\left(x_{0arg${id}},y_{0arg${id}}+h_{arg${id}}\\right)\\right]`
		},
		{
			type: `text`,
			id: `${id} barchart setup text overall x scaling variable`,
			folderId: `${id} barchart setup folder`,
			text: `overall x scaling variable`
		},
		{
			type: `expression`,
			id: `${id} barchart setup overall x scaling variable`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `S_{x${id}}=s_{1${id}}s_{6${id}}+s_{1${id}}k_{${id}}+s_{1${id}}s_{5x${id}}`
		},
		{
			type: `text`,
			id: `${id} barchart setup text overall y scaling variable`,
			folderId: `${id} barchart setup folder`,
			text: `overall y scaling variable`
		},
		{
			type: `expression`,
			id: `${id} barchart setup overall y scaling variable`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `S_{y${id}}=s_{4${id}}\\max\\left(M_{g${id}}\\right)`
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_0 : x-offset`,
			folderId: `${id} barchart setup folder`,
			text: `s_0 : x-offset`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{0${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `s_{0${id}}=${defaultValues["s_{0}"]}`,
			hidden: true,
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_1 : x-stretch`,
			folderId: `${id} barchart setup folder`,
			text: `s_1 : x-stretch`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{1${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#388c46`,
			latex: `s_{1${id}}=${defaultValues["s_{1}"]}`,
			hidden: true,
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_2 : gap (0 = full gap, 1 = no gap)`,
			folderId: `${id} barchart setup folder`,
			text: `s_2 : gap (0 = full gap, 1 = no gap)`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{2${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `s_{2${id}}=${defaultValues["s_{2}"]}`,
			hidden: true,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_3 : y-offset`,
			folderId: `${id} barchart setup folder`,
			text: `s_3 : y-offset`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{3${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `s_{3${id}}=${defaultValues["s_{3}"]}`,
			hidden: true,
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_4 : y-stretch`,
			folderId: `${id} barchart setup folder`,
			text: `s_4 : y-stretch`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{4${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#2d70b3`,
			latex: `s_{4${id}}=${defaultValues["s_{4}"]}`,
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_5x : x axis extension`,
			folderId: `${id} barchart setup folder`,
			text: `s_5x : x axis extension`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{5x${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `s_{5x${id}}=${defaultValues["s_{5x}"]}`
		},
		{
			type: `text`,
			id: `${id} s_5y : y axis (continuous) extension`,
			folderId: `${id} barchart setup folder`,
			text: `s_5y : y axis (continuous) extension`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{5y${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `s_{5y${id}}=${defaultValues["s_{5y}"]}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value i_{ntegerLockYScale${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `i_{ntegerLockYScale${id}}=${defaultValues["i_{ntegerLockYScale}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text n_5y : y axis (integer locked) extension`,
			folderId: `${id} barchart setup folder`,
			text: `n_5y : y axis (integer locked) extension`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value n_{5y${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#2d70b3`,
			latex: `n_{5y${id}}=${defaultValues["n_{5y}"]}`,
			slider: {
				hardMin: true,
				min: `0`,
				step: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text s_6 : x-offset of first bar from origin`,
			folderId: `${id} barchart setup folder`,
			text: `s_6 : x-offset of first bar from origin`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{6${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#2d70b3`,
			latex: `s_{6${id}}=${defaultValues["s_{6}"]}`,
		},
		{
			type: `text`,
			id: `${id} barchart setup text x axis line`,
			folderId: `${id} barchart setup folder`,
			text: `x axis line`
		},
		{
			type: `expression`,
			id: `${id} setup x axis line`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+\\left(s_{1${id}}s_{6${id}}+s_{1${id}}k_{${id}}+s_{1${id}}s_{5x${id}}\\right)t,s_{3${id}}\\right)`
		},
		{
			type: `text`,
			id: `${id} barchart setup text y axis line (continuous)`,
			folderId: `${id} barchart setup folder`,
			text: `y axis line (continuous)`
		},
		{
			type: `expression`,
			id: `${id} setup y axis line continuous`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}},s_{3${id}}+\\left(\\left(1+s_{5y${id}}\\right)s_{4${id}}\\max\\left(M_{g${id}}\\right)\\right)t\\right)\\left\\{i_{ntegerLockYScale${id}}=0\\right\\}`
		},
		{
			type: `text`,
			id: `${id} barchart setup text y axis line (integer locked)`,
			folderId: `${id} barchart setup folder`,
			text: `y axis line (integer locked)`
		},
		{
			type: `expression`,
			id: `${id} setup y axis line integer locked`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}},s_{3${id}}+s_{4${id}}\\left(\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)+n_{5y${id}}\\right)t\\right)\\left\\{i_{ntegerLockYScale${id}}=1\\right\\}`
		},
		{
			type: `text`,
			id: `${id} barchart setup text x axis labels`,
			folderId: `${id} barchart setup folder`,
			text: `x axis labels`
		},
		...xLabelExpressions,
		{
			type: `expression`,
			id: `${id} barchart setup value s_{howx${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#388c46`,
			latex: `s_{howx${id}}=${defaultValues["s_{howx}"]}`,
			hidden: true,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text y axis labels`,
			folderId: `${id} barchart setup folder`,
			text: `y axis labels`
		},
		{
			type: `expression`,
			id: `${id} barchart setup y axis marks`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}-0.016S_{x${id}},a_{y${id}}\\right)`,
			showLabel: true,
			label: `\${a_{yl${id}}}`,
			hidden: true,
			labelSize: `small`,
			labelOrientation: `left`
		},
		{
			type: `expression`,
			id: `${id} barchart setup y axis mark position list`,
			folderId: `${id} barchart setup folder`,
			color: `#388c46`,
			latex: `a_{y${id}}=\\left\\{i_{ntegerLockYScale${id}}=0:s_{3${id}}+\\left(1+s_{5y${id}}\\right)s_{4${id}}\\max\\left(M_{g${id}}\\right)\\cdot\\left[0,\\frac{1}{n_{y${id}}}...1\\right],i_{ntegerLockYScale${id}}=1:s_{3${id}}+s_{4${id}}\\left(\\operatorname{ceil}\\left(\\max\\left(M_{g${id}}\\right)\\right)+n_{5y${id}}\\right)\\cdot\\left[0,\\frac{1}{n_{y${id}}}...1\\right]\\right\\}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup y axis mark value list`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `a_{yl${id}}=\\operatorname{round}\\left(\\frac{a_{y${id}}-s_{3${id}}}{s_{4${id}}},1\\right)`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value n_{y${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `n_{y${id}}=${defaultValues["n_{y}"]}`,
			hidden: true,
			slider: {
				hardMin: true,
				min: `0`,
				step: `1`
			}
		},
		{
			type: `text`,
			id: `${id} barchart setup text y axis tickmarks`,
			folderId: `${id} barchart setup folder`,
			text: `y axis tickmarks`
		},
		{
			type: `expression`,
			id: `${id} barchart setup y axis tickmarks`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(\\left(\\sqrt{s_{howYTickmarks${id}}-1}+1\\right)s_{0${id}}-0.015S_{x${id}}t,a_{y${id}}\\right)`
		},
		{
			type: `text`,
			id: `${id} barchart setup text x axis title (hidden when x axis labels are hidden)`,
			folderId: `${id} barchart setup folder`,
			text: `x axis title (hidden when x axis labels are hidden)`
		},
		{
			type: `expression`,
			id: `${id} barchart setup x axis title`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}\\operatorname{median}\\left(l_{${id}}\\right),s_{3${id}}-0.3S_{y${id}}\\right)\\left\\{s_{howx${id}}=1\\right\\}\\left\\{s_{howx${id}}=1\\right\\}`,
			showLabel: true,
			label: xTitle,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `large`
		},
		{
			type: `text`,
			id: `${id} barchart setup text y axis title (hidden when number of y axis marks is set to 0)`,
			folderId: `${id} barchart setup folder`,
			text: `y axis title (hidden when number of y axis marks is set to 0)`
		},
		{
			type: `expression`,
			id: `${id} barchart setup y axis title`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}-0.18S_{x${id}},\\operatorname{median}\\left(a_{y${id}}\\right)\\right)`,
			showLabel: true,
			label: yTitle,
			hidden: true,
			dragMode: `NONE`,
			labelSize: `large`,
			verticalLabel: true
		},
		{
			type: `text`,
			id: `${id} barchart setup text value labels`,
			folderId: `${id} barchart setup folder`,
			text: `value labels`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value s_{howvals${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#388c46`,
			latex: `s_{howvals${id}}=${defaultValues["s_{howvals}"]}`,
			hidden: true,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup function r_{oundSigFigs${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `r_{oundSigFigs${id}}\\left(x,n_{round${id}}\\right)=\\operatorname{round}\\left(x,-\\left(1+\\operatorname{floor}\\left(\\log_{10}\\left(x\\right)\\right)-n_{round${id}}\\right)\\right)`
		},
		{
			type: `expression`,
			id: `${id} barchart setup rounded group mean values`,
			folderId: `${id} barchart setup folder`,
			color: `#2d70b3`,
			latex: `r_{oundedValues${id}}=r_{oundSigFigs${id}}\\left(M_{g${id}},3\\right)`
		},
		{
			type: `expression`,
			id: `${id} setup bar value labels`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}},s_{3${id}}+s_{4${id}}M_{g${id}}\\right)\\left\\{s_{howvals${id}}=1\\right\\}`,
			showLabel: true,
			label: `\${r_{oundedValues${id}}}`,
			hidden: true,
			labelOrientation: `above`
		},
		{
			type: `text`,
			id: `${id} barchart setup text error bars`,
			folderId: `${id} barchart setup folder`,
			text: `error bars`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value e_{rrorBarType${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `e_{rrorBarType${id}}=${defaultValues["e_{rrorBarType}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `n_{umErrorBarTypes${id}}`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup value e_{rrorBarWidth${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#388c46`,
			latex: `e_{rrorBarWidth${id}}=${defaultValues["e_{rrorBarWidth}"]}`,
			slider: {
				hardMin: true,
				hardMax: true,
				min: `0`,
				max: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar length`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `e_{rrorBarLength${id}}=\\left\\{e_{rrorBarType${id}}=0:\\sqrt{-1},e_{rrorBarType${id}}=1:e_{rrorBarLengthCI${id}},e_{rrorBarType${id}}=2:e_{rrorBarLengthSEM${id}},e_{rrorBarType${id}}=3:e_{rrorBarLengthSD${id}}\\right\\}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar length CI`,
			folderId: `${id} barchart setup folder`,
			color: `#c74440`,
			latex: `e_{rrorBarLengthCI${id}}=C_{I95${id}}\\cdot s_{4${id}}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar length SEM`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `e_{rrorBarLengthSEM${id}}=S_{EM${id}}\\cdot s_{4${id}}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar length SD`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `e_{rrorBarLengthSD${id}}=S_{D${id}}\\cdot s_{4${id}}`
		},
		{
			type: `expression`,
			id: `${id} barchart setup value n_{umErrorBarTypes${id}}`,
			folderId: `${id} barchart setup folder`,
			color: `#6042a6`,
			latex: `n_{umErrorBarTypes${id}}=${defaultValues["n_{umErrorBarTypes}"]}`,
			slider: {
				hardMin: true,
				min: `0`,
				step: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar upper horizontal lines`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}+s_{1${id}}\\left(\\frac{e_{rrorBarWidth${id}}t}{2}\\right),e_{rrorBarLength${id}}+s_{3${id}}+s_{4${id}}M_{g${id}}\\right)`,
			parametricDomain: {
				min: `-1`,
				max: ``
			},
			domain: {
				min: `-1`,
				max: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar lower horizontal lines`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}}+s_{1${id}}\\left(\\frac{e_{rrorBarWidth${id}}t}{2}\\right),-e_{rrorBarLength${id}}+s_{3${id}}+s_{4${id}}M_{g${id}}\\right)`,
			parametricDomain: {
				min: `-1`,
				max: ``
			},
			domain: {
				min: `-1`,
				max: `1`
			}
		},
		{
			type: `expression`,
			id: `${id} barchart setup error bar vertical lines`,
			folderId: `${id} barchart setup folder`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}s_{6${id}}+s_{1${id}}l_{${id}},e_{rrorBarLength${id}}t+s_{3${id}}+s_{4${id}}M_{g${id}}\\right)`,
			parametricDomain: {
				min: `-1`,
				max: ``
			},
			domain: {
				min: `-1`,
				max: `1`
			}
		},
		{
			type: `text`,
			id: `${id} (no folder) text scaled data plot`,
			text: `scaled data plot`
		},
		{
			type: `expression`,
			id: `${id} (no folder) scaled data plot`,
			color: `#000000`,
			latex: `\\left(s_{0${id}}+s_{1${id}}x_{data${id}}+s_{1${id}}s_{6${id}},s_{3${id}}+s_{4${id}}y_{data${id}}\\right)`,
			hidden: true,
			pointStyle: `CROSS`,
			dragMode: `NONE`
		}
	]
	return barchartExpressions
}

generateOneWayAnovaExpressionsCategoricalByContinuous = function(id){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	defaultValues = {
		"F_{labelDragX}":1,//F label relative x position
		"F_{labelDragY}":1//F label relative y position
	}
	
	anovaExpressions = [
		{
			type: `folder`,
			id: `${id} ANOVA folder`,
			title: `[${id}] ANOVA`,
			collapsed: true
		},
				{
			type: `expression`,
			id: `${id} ANOVA p value`,
			folderId: `${id} ANOVA folder`,
			color: `#388c46`,
			latex: `p_{value${id}}=p_{${id}}\\left(F_{${id}},d_{fGroup${id}},d_{fResidual${id}}\\right)`
		},
		{
			id: `${id} ANOVA table`,
			type: `table`,
			folderId: `${id} ANOVA folder`,
			columns: [
				{
					values: [
						`G_{roup${id}}`,
						`R_{esidual${id}}`,
						`T_{otal${id}}`
					],
					hidden: true,
					id: `${id} ANOVA table column 0`,
					color: `#003b6f`,
					latex: `c_{rowLabels${id}}`
				},
				{
					values: [
						``,
						``,
						``
					],
					hidden: true,
					id: `${id} ANOVA table column 1`,
					color: `#003b6f`,
					latex: `c_{df${id}}`
				},
				{
					values: [
						``,
						``,
						``
					],
					hidden: true,
					id: `${id} ANOVA table column 2`,
					color: `#003b6f`,
					latex: `c_{SS${id}}`
				},
				{
					values: [
						``,
						``,
						``
					],
					hidden: true,
					id: `${id} ANOVA table column 3`,
					color: `#003b6f`,
					latex: `c_{MS${id}}`
				},
				{
					values: [
						``,
						``,
						``
					],
					hidden: true,
					id: `${id} ANOVA table column 4`,
					color: `#003b6f`,
					latex: `c_{F${id}}`
				}
			]
		},
		{
			type: `expression`,
			id: `${id} ANOVA group degrees of freedom`,
			folderId: `${id} ANOVA folder`,
			color: `#6042a6`,
			latex: `d_{fGroup${id}}=k_{${id}}-1`
		},
		{
			type: `expression`,
			id: `${id} ANOVA residual degrees of freedom`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `d_{fResidual${id}}=N_{Total${id}}-k_{${id}}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA total degrees of freedom`,
			folderId: `${id} ANOVA folder`,
			color: `#c74440`,
			latex: `d_{fTotal${id}}=N_{Total${id}}-1`
		},
		{
			type: `expression`,
			id: `${id} ANOVA degrees of freedom list`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `c_{df${id}}=\\left[d_{fGroup${id}},d_{fResidual${id}},d_{fTotal${id}}\\right]`
		},
		{
			type: `expression`,
			id: `${id} ANOVA residual sum of squares`,
			folderId: `${id} ANOVA folder`,
			color: `#6042a6`,
			latex: `S_{SResidual${id}}=\\operatorname{total}\\left(S_{SPerGroup${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} ANOVA total sum of squares`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `S_{STotal${id}}=S_{umSquares${id}}\\left(y_{data${id}}\\right)`
		},
		{
			type: `expression`,
			id: `${id} ANOVA group sum of squares`,
			folderId: `${id} ANOVA folder`,
			color: `#c74440`,
			latex: `S_{SGroup${id}}=S_{STotal${id}}-S_{SResidual${id}}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA sum of squares list`,
			folderId: `${id} ANOVA folder`,
			color: `#2d70b3`,
			latex: `c_{SS${id}}=\\left[S_{SGroup${id}},S_{SResidual${id}},S_{STotal${id}}\\right]`
		},
		{
			type: `expression`,
			id: `${id} ANOVA group mean squares`,
			folderId: `${id} ANOVA folder`,
			color: `#2d70b3`,
			latex: `M_{SGroup${id}}=\\frac{S_{SGroup${id}}}{d_{fGroup${id}}}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA residual mean squares`,
			folderId: `${id} ANOVA folder`,
			color: `#388c46`,
			latex: `M_{SResidual${id}}=\\frac{S_{SResidual${id}}}{d_{fResidual${id}}}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA mean squares list`,
			folderId: `${id} ANOVA folder`,
			color: `#388c46`,
			latex: `c_{MS${id}}=\\left[M_{SGroup${id}},M_{SResidual${id}}\\right]`
		},
		{
			type: `expression`,
			id: `${id} ANOVA F value`,
			folderId: `${id} ANOVA folder`,
			color: `#6042a6`,
			latex: `F_{${id}}=\\frac{M_{SGroup${id}}}{M_{SResidual${id}}}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA F value list`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `c_{F${id}}=\\left[F_{${id}}\\right]`
		},
		{
			type: `text`,
			id: `${id} ANOVA F distribution sources`,
			folderId: `${id} ANOVA folder`,
			text: `F-distribution calculation sources:\nhttps://en.wikipedia.org/wiki/F-distribution\nhttps://en.wikipedia.org/wiki/Beta_function#Incomplete_beta_function`
		},
		{
			type: `expression`,
			id: `${id} ANOVA function definition complete beta function`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `B_{c${id}}\\left(x,y\\right)=\\int_{0}^{1}t^{x-1}\\left(1-t\\right)^{y-1}dt`
		},
		{
			type: `expression`,
			id: `${id} ANOVA function definition incomplete beta function`,
			folderId: `${id} ANOVA folder`,
			color: `#2d70b3`,
			latex: `B_{i${id}}\\left(x,a_{arg${id}},b_{arg${id}}\\right)\\ =\\ \\int_{0}^{x}t^{a_{arg${id}}-1}\\left(1-t\\right)^{b_{arg${id}}-1}dt`
		},
		{
			type: `expression`,
			id: `${id} ANOVA function definition regularized incomplete beta function`,
			folderId: `${id} ANOVA folder`,
			color: `#6042a6`,
			latex: `I_{${id}}\\left(x,a_{arg${id}},b_{arg${id}}\\right)=\\frac{B_{i${id}}\\left(x,a_{arg${id}},b_{arg${id}}\\right)}{B_{c${id}}\\left(a_{arg${id}},b_{arg${id}}\\right)}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA F cumulative distribution function`,
			folderId: `${id} ANOVA folder`,
			color: `#388c46`,
			latex: `F_{cdf${id}}\\left(x,d_{1arg${id}},d_{2arg${id}}\\right)=I_{${id}}\\left(\\frac{d_{1arg${id}}x}{d_{1arg${id}}x+d_{2arg${id}}},\\frac{d_{1arg${id}}}{2},\\frac{d_{2arg${id}}}{2}\\right)`
		},
		{
			type: `text`,
			id: `${id} ANOVA explanatory note p values`,
			folderId: `${id} ANOVA folder`,
			text: `The F statistic is larger at more extreme values so the probability of an F value as extreme or more so than a given value will be the probability it is greater or equal to that value, whereas the c.d.f. gives the probability it is less than or equal to that value. This is the reason for doing 1-F_cdf to obtain the p-value`
		},
		{
			type: `expression`,
			id: `${id} ANOVA p value function`,
			folderId: `${id} ANOVA folder`,
			color: `#2d70b3`,
			latex: `p_{${id}}\\left(F_{arg${id}},d_{1arg${id}},d_{2arg${id}}\\right)=1-F_{cdf${id}}\\left(F_{arg${id}},d_{1arg${id}},d_{2arg${id}}\\right)`
		},
		{
			type: `text`,
			id: `${id} ANOVA text defining row labels to prevent desmos error messages`,
			folderId: `${id} ANOVA folder`,
			text: `defining row labels to prevent desmos error messages`
		},
		{
			type: `expression`,
			id: `${id} ANOVA row label G_{roup${id}}`,
			folderId: `${id} ANOVA folder`,
			color: `#388c46`,
			latex: `G_{roup${id}}=e^{0}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA row label R_{esidual${id}}`,
			folderId: `${id} ANOVA folder`,
			color: `#c74440`,
			latex: `R_{esidual${id}}=e^{0}`
		},
		{
			type: `expression`,
			id: `${id} ANOVA row label T_{otal${id}}`,
			folderId: `${id} ANOVA folder`,
			color: `#000000`,
			latex: `T_{otal${id}}=e^{0}`
		},
		{
			type: `folder`,
			id: `${id} F and p value label folder`,
			title: `[${id}] F and p value label`,
			collapsed: true
		},
		{
			type: `text`,
			id: `${id} F and p value label dependency note`,
			folderId: `${id} F and p value label folder`,
			text: `The expressions in this folder are dependent on the barchart setup folder and the ANOVA folder`
		},
		{
			type: `expression`,
			id: `${id} F and p value label rounder F value`,
			folderId: `${id} F and p value label folder`,
			color: `#c74440`,
			latex: `F_{rounded${id}}=\\operatorname{round}\\left(F_{${id}},4\\right)`
		},
		{
			type: `expression`,
			id: `${id} F and p value label F label`,
			folderId: `${id} F and p value label folder`,
			color: `#000000`,
			latex: `F_{label${id}}=\\left(s_{0${id}}+S_{x${id}}\\cdot F_{labelDragX${id}},s_{3${id}}+S_{y${id}}\\cdot F_{labelDragY${id}}\\right)`,
			showLabel: true,
			label: `\`F_{\${d_{fGroup${id}}},\${d_{fResidual${id}}}}=\${F_{rounded${id}}}\``,
			hidden: true,
			labelSize: `small`,
			labelOrientation: `right`
		},
		{
			type: `expression`,
			id: `${id} F and p value label rounded p value`,
			folderId: `${id} F and p value label folder`,
			color: `#388c46`,
			latex: `p_{rounded${id}}=\\operatorname{round}\\left(p_{value${id}},4\\right)`
		},
		{
			type: `expression`,
			id: `${id} F and p value label p label`,
			folderId: `${id} F and p value label folder`,
			color: `#000000`,
			latex: `p_{label${id}}=F_{label${id}}-\\left(0,0.12S_{y${id}}\\right)`,
			showLabel: true,
			label: `\`p=\${p_{rounded${id}}}\``,
			hidden: true,
			labelSize: `small`,
			labelOrientation: `right`
		},
		{
			type: `expression`,
			id: `${id} F and p value label value F_{labelDragX${id}}`,
			folderId: `${id} F and p value label folder`,
			color: `#6042a6`,
			latex: `F_{labelDragX${id}}=${defaultValues["F_{labelDragX}"]}`
		},
		{
			type: `expression`,
			id: `${id} F and p value label value F_{labelDragY${id}}`,
			folderId: `${id} F and p value label folder`,
			color: `#000000`,
			latex: `F_{labelDragY${id}}=${defaultValues["F_{labelDragY}"]}`
		},
		{
			type: `text`,
			id: `${id} F and p value label text F and p label position customisation (dependent on customisation folder)`,
			folderId: `${id} F and p value label folder`,
			text: `F and p label position customisation (dependent on customisation folder)`
		},
		{
			type: `expression`,
			id: `${id} F and p value label F and p label position customisation (dependent on customisation folder)`,
			folderId: `${id} F and p value label folder`,
			color: `#000000`,
			latex: `F_{labelDrag${id}}=\\left(\\left(\\sqrt{s_{howExtraCustomisation${id}}-1}+1\\right)s_{0${id}}+S_{x${id}}\\cdot F_{labelDragX${id}},s_{3${id}}+S_{y${id}}\\cdot F_{labelDragY${id}}\\right)`,
			labelSize: `small`,
			labelOrientation: `right`
		}
	]
	return anovaExpressions
}

class DataFrame {
	constructor(columnHeaders,dataRows2dArray){
		this._headerTypeDict = {}//empty dictionary, filled the first time get headerTypeDict is called
		this._factorLevelDict = {}
		this.data = dataRows2dArray.map(
			row => Object.fromEntries(
				row.map((x,i)=>
					[columnHeaders[i],x]
				)
			)
		)
		//initialise forceCategoricalDict as a dictionary with the headers as keys and false as each value
		//if the forceCategorical() method is called on a header, its value in the dictionary will be set to true
		this.forceCategoricalDict = Object.fromEntries(
			columnHeaders.map(
				header => [header,false]
			)
		)
		this.properties = ["properties","data","forceCategoricalDict","headerRow","headerTypeDict","factorLevelDict","dataRows","dataColumns","size","headerIndexDict"]
		return new Proxy(this,//Proxy only affects external get and set calls so cannot be used internally
			{
				get: function(obj,prop){
					//DataFrame property
					if (obj.properties.includes(prop)){
						return Reflect.get(obj,prop)
					}
					//DataFrame method - https://2ality.com/2015/10/intercepting-method-calls.html
					else if (typeof(obj[prop])=="function"){
						return function(...args){
							if (
								args[0] instanceof Array 
								&& 
								args[0].every(x=>obj.headerRow.includes(x))
								&& 
								(func => //get arguments - https://stackoverflow.com/a/39253854
									new RegExp('(?:'+func.name+'\\s*|^)\\s*\\((.*?)\\)').exec(func.toString().replace(/\n/g, ''))[1].replace(/\/\*.*?\*\//g, '').replace(/ /g, '')
								)(obj[prop]) == ["header"]
							){
								return args[0].map(x=>obj[prop].apply(obj,[x]))//https://stackoverflow.com/questions/41354099/getting-error-createlistfromarraylike-called-on-non-object-when-trying-to-use-a
							}
							else{
								return obj[prop].apply(obj,args)
							}
						}
					}
					//column header
					else if (obj.headerRow.includes(prop)){
						return obj.data.map(row=>row[prop])
					}
					//list of column headers - when indexing an object with an array, js coerces the array to string so .split(",") is required to undo this
					else if (prop.split(",") instanceof Array && prop.split(",").every(x=>obj.headerRow.includes(x))){
						return prop.split(",").map(header=>obj.data.map(row=>row[header]))
					}
					else{
						throw new DataFrameError(`invalid property name: "${prop}"`)
					}
				},
				set: function(obj,prop,value){
					if (obj.properties.includes(prop)){
						Reflect.set(obj,prop,value)
						return true
					}
					else if (value instanceof Array){
						if(value.length == obj.size[0]){
							Reflect.set(obj,"data",obj.data.map((row,i)=>({...row,[prop]:value[i]})))
							return true
						}
						else{
							throw new DataFrameError(`cannot add a column of length ${value.length} to a DataFrame with ${obj.size[0]} rows`)
						}
					}
					else{
						throw new DataFrameError(`invalid property name: "${prop}"`)
					}
				}
			}
		)
	}
	
	//methods other than getters and setters are  called externally so goes through the Proxy, meaning the external properties like this.headerTypeDict must be referred to, not the internal this._headerTypeDict
	
	forceCategorical(header){
		if (this.headerRow.includes(header)){
			this.forceCategoricalDict[header]=true
			this.headerTypeDict[header] = "categorical"
		}
		else{
			throw new DataFrameError(`"${header}" is not a valid column header`)
		}
	}
	
	undoForceCategorical(header){
		if (this.headerRow.includes(header)){
			if(!isCategorical(
				this.data.map(
					row=>
						row[header]
					)
				)
			){
				this.forceCategoricalDict[header]=false
				this.headerTypeDict[header] = "continuous"
			}
			else{
				throw new DataFrameError(`"${header}" is a categorical variable and cannot be coerced to continuous`)
			}
		}
		else{
			throw new DataFrameError(`"${header}" is not a valid column header`)
		}
	}
	
	get headerRow(){
		return Object.keys(this.data[0])
	}
	
	get headerTypeDict(){
		//check if _headerTypeDict is up to date
		if (arraysEqual(Object.keys(this._headerTypeDict).sort(),this.headerRow.sort())){
			return this._headerTypeDict
		}
		//otherwise, update _headerTypeDict before returning it
		else{
			this._headerTypeDict = Object.fromEntries(
				this.headerRow.map(
					header => 
						[
							header,
							//"categorical" if the data in the column is categorical or if forceCategorical() has been applied to the column, "continuous" otherwise
							(isCategorical(this.data.map(row=>row[header])) || this.forceCategoricalDict[header] == true)? "categorical" : "continuous"
						]
				)
			)
			return this._headerTypeDict
		}
	}
	
	get factorLevelDict(){
		//check if _factorLevelDict is up to date
		if (arraysEqual(Object.keys(this._factorLevelDict).sort(),this.headerRow.sort())){
			return this._factorLevelDict
		}
		//otherwise, update _factorLevelDict before returning it
		else{
			//the distinction between this code and the code in the updateFactorLevelDict() method is that this code is run internally so cannot access the this[header] abstraction, instead using this.data.map(row=>row[header])
			this._factorLevelDict = Object.fromEntries(
				this.headerRow.map(
					header => [
						header,
						(this.headerTypeDict[header]=="categorical")?
						//if the column corresponding to header is categorical:
							[...new Set(this.data.map(row=>row[header]))]//remove the duplicates from the column and assign the resulting list of levels to the corresponding entry in factorLevelDict
						://otherwise
							[]//assign an empty array to the corresponding entry in factorLevelDict
					]
				)
			)
			return this._factorLevelDict
		}
	}
	
	set factorLevelDict(value){
		if (value instanceof Object){
			if (//ensure new factorLevelDict value has the same keys as headerRow
				arraysEqual(Object.keys(value).sort(),this.headerRow.sort())
			){
				if(//ensure new factorLevelDict value has array values
					Object.values(value).every(x=>x instanceof Array)
				){
					this._factorLevelDict = value
					return true
				}
				else{
					throw new DataFrameError(`all values in factorLevelDict must be arrays (empty array for continuous variables)`)
				}
			}
			else{
				throw new DataFrameError(`factorLevelDict must have an entry for each column header in the DataFrame`)
			}
		}
		else{
			throw new DataFrameError(`factorLevelDict must be an object with an entry for each column header in the DataFrame`)
		}
	}
	
	get dataRows(){
		return this.data.map(row=>Object.values(row))
	}
	
	get dataColumns(){
		return transpose(this.dataRows)
	}
	
	get size(){
		return [this.data.length,this.headerRow.length]
	}
	
	updateFactorLevelDict(){
		this.factorLevelDict = Object.fromEntries(
			this.headerRow.map(
				header => [
					header,
					(this.headerTypeDict[header]=="categorical")
					?//if the column corresponding to header is categorical:
						[...new Set(this[header])]//remove the duplicates from the column and assign the resulting list of levels to the corresponding entry in factorLevelDict
					://otherwise
						[]//assign an empty array to the corresponding entry in factorLevelDict
				]
			)
		)
	}
	
	head(n=5){//display a table (in the console) of the header row and the first five rows of the table
		if (this.data.length >= n){
			console.table(this.data.slice(0,n))
		}
		else{
			throw new DataFrameError(`cannot display the first ${n} rows of a DataFrame with ${this.data.length} rows`)
		}
	}
	
	randomHead(n=5){//display a table (in the console) of the header row and 5 randomly selected rows
		const randomIndices = Array(n).fill(0).map(x=>(Math.floor(Math.random()*this.data.length)))
		console.table(randomIndices.map(x=>this.data[x]))
	}
	
	rename(header,newHeader){
		if (this.headerRow.includes(header)){
			//rename column header and preserve column order
			this.data = this.data.map(row => 
				Object.fromEntries(
					Object.entries(row).map(
						keyValuePair =>
							[
								(keyValuePair[0] == header)?
									newHeader
								:
									keyValuePair[0]
							,
								keyValuePair[1]
							]
					)
				)
			)
			//preserve column type
			if (this.forceCategoricalDict[header] == true){
				this.forceCategoricalDict[newHeader]=true
				this.headerTypeDict[newHeader] = "categorical"
			}
			else{
				this.forceCategoricalDict[newHeader] = false
			}
			delete this.forceCategoricalDict[header]
		}
		else{
			throw new DataFrameError(`this DataFrame has no column with the header "${header}"`)
		}
	}
	
	drop(header){
		if (this.headerRow.includes(header)){
			this.data.forEach(row => delete row[header])
			delete this.forceCategoricalDict[header]
		}
		else{
			throw new DataFrameError(`this DataFrame has no column with the header "${header}"`)
		}
	}
	
	addRow(newRow){
		if (newRow instanceof Array){
			if (newRow.length == this.headerRow.length){//ensure newRow has the same length as headerRow
				if(//ensure newRow has the same data types as each corresponding column
					newRow.every(
						(x,i)=>
							(isNaN(x) == isCategorical(this.dataColumns[i]))
					)
				){
					this.data.push(
						Object.fromEntries(
							newRow.map(
								(x,i)=>
									[this.headerRow[i],x]
							)
						)
					)
					this.updateFactorLevelDict()
				}
				else{
					throw new DataFrameError(`new row array must have the same data types as each column in the DataFrame`)
				}
			}
			else{
				throw new DataFrameError(`new row array must have the same length as the number of columns in the DataFrame (${this.headerRow.length})`)
			}
		}
		else if (newRow instanceof Object){
			if (//ensure newRow has the same keys as headerRow
				arraysEqual(Object.keys(newRow).sort(),this.headerRow.sort())
			){
				if(//ensure newRow has the same data types as each corresponding column
					Object.entries(newRow).every(
						keyValuePair=>
							(isNaN(keyValuePair[1]) == isCategorical(this.data.map(row=>row[keyValuePair[0]])))
					)
				){
					this.data.push(newRow)
				}
				else{
					throw new DataFrameError(`new row object must have the same types (categoric/continuous) as each corresponding column`)//TODO
				}
			}
			else{
				throw new DataFrameError(`new row object must have the same keys as the rest of the rows in the DataFrame`)
			}
		}
		else{
			throw new DataFrame(`new row must be an object or array`)
		}
	}
	
	merge(secondDataFrame){
		if (secondDataFrame instanceof DataFrame){
			if (secondDataFrame.size[0] == this.size[0]){
				//secondDataFrame will overwrite columns in this DataFrame if there are columns with the same headers
				this.data = this.data.map((row,i) => ({...row,...secondDataFrame.data[i]}))
				secondDataFrame.headerRow.forEach( newHeader => {
					//preserve column types
					if (secondDataFrame.forceCategoricalDict[newHeader] == true){
						this.forceCategoricalDict[newHeader]=true
						this.headerTypeDict[newHeader] = "categorical"
					}
					else{
						this.forceCategoricalDict[newHeader] = false
					}
				})
			}
			else{
				throw new DataFrameError(`cannot join two DataFrames with different numbers of rows`)
			}
		}
		else{
			throw new DataFrameError(`the argument for the DataFrame.merge() method must be another DataFrame object`)
		}
	}
	
	levels(header){
		if (this.headerRow.includes(header)){
			const columnType =  this.headerTypeDict[header]
			if (columnType == "categorical"){
				return this.factorLevelDict[header]
			}
			else if(columnType=="continuous"){
				throw new DataFrameError(`cannot obtain the levels of the continuous variable "${header}"
				Hint: you can coerce this variable to categorical by using the DataFrame.forceCategorical() method`)
			}
			else{//in case any types beyond continuous and categorical are ever added or if headerTypeDict is manually mutated incorrectly
				throw new DataFrameError(`cannot obtain the levels of the ${columnType} variable "${header}"`)
			}
		}
		else{
			throw new DataFrameError(`this DataFrame has no column with the header "${header}"`)
		}
	}
	
	subsetRows(conditionFunction){//returns new DataFrame
		//conditionFunction example: row => row["id"]=="1"
		return new DataFrame(this.headerRow,this.data.filter(conditionFunction).map(row=>Object.values(row)))
	}
	
	subsetColumns(conditionFunction){//returns new DataFrame
		//conditionFunction example: column => column.every(x=>typeof(x)=="number)
		const includeIndices = this.dataColumns.map(column => conditionFunction(column))
		const subsetHeaderRow = this.headerRow.filter((x,i) => includeIndices[i])
		const subsetDataColumns = this.dataColumns.filter((x,i) => includeIndices[i])
		const subsetDataRows = transpose(subsetDataColumns)
		return new DataFrame()
	}
	
	splitByFactor(header,removeFactorFromSubset = false){//returns array of new DataFrames
		const factorLevels = this.levels(header)//the levels() method includes checks to ensure the header is valid and the corresponding column type is categorical
		return factorLevels.map(level => this.subsetRows(row=>row[header]==level))
	}
	
	//for compatibility with functions that were written for old DataFrame class
	get headerIndexDict(){
		return Object.fromEntries(
			this.headerRow.map(
				header =>
					[
						header
					,
						this.headerRow.findIndex(x=> x == header)
					]
			)
		)
	}
	
	ANOVA(id,independentColumnHeader,dependentColumnHeader){
		//rename variables
		var xColumnHeader = independentColumnHeader
		var yColumnHeader = dependentColumnHeader
		var xColumnType = this.headerTypeDict[xColumnHeader]
		var yColumnType = this.headerTypeDict[yColumnHeader]
		if (xColumnType == "categorical" && yColumnType == "continuous"){
			var levels = this.factorLevelDict[xColumnHeader]
			var dataColumns = transpose(this.dataRows)
			var xCategoricalData = dataColumns[this.headerIndexDict[xColumnHeader]]
			var yContinuousData = dataColumns[this.headerIndexDict[yColumnHeader]]
			var newExpressions = []
			var state = Calc.getState()
			if (state.expressions.list.filter(x=>(x.id==`${id} data folder`)).length == 0){//if data expressions with this id are not already present in the calculator, add them
				newExpressions = generateDataExpressionsCategoricalByContinuous(id,levels,xCategoricalData,yContinuousData)
			}
			newExpressions = newExpressions.concat(generateOneWayAnovaExpressionsCategoricalByContinuous(id))
			state.expressions.list = state.expressions.list.concat(newExpressions)
			Calc.setState(state,{allowUndo:true})
		}
		else if (xColumnType == "continuous" && yColumnType == "continuous"){//regression ANOVA
			throw new DataFrameError(`regression ANOVA of a continuous variable against another is not yet supported`)
		}
		else {
			throw new DataFrameError(`cannot perform one way ANOVA of the ${yColumnType} variable "${yColumnHeader}" against the ${xColumnType} variable "${xColumnHeader}"`)
		}
	}
	
	scatterplot(id,xColumnHeader,yColumnHeader,lines=false,points=true){//create a table in desmos containing two columns which will then be plotted. allows for plotting of large datasets without crashing desmos by trying to get it to store the whole table
	//id should not contain any LaTeX subsripts (e.g.s_{catterplot1})
	//a good id could be something like "scatterplot1"
		var xColumnType = this.headerTypeDict[xColumnHeader]
		var yColumnType = this.headerTypeDict[yColumnHeader]
		if (xColumnType == "continuous" && yColumnType == "continuous"){
			var dataColumns = transpose(this.dataRows)
			var xValues = dataColumns[this.headerIndexDict[xColumnHeader]]
			var yValues = dataColumns[this.headerIndexDict[yColumnHeader]]
			var xColumn = {id:`${id}x`,latex:`x_{${id}}`,values:xValues}
			var yColumn = {id:`${id}y`,latex:`y_{${id}}`,values:yValues,points:points,lines:lines}
			Calc.setExpression({id:id,type:"table",columns:[xColumn,yColumn]})
		}
		else{
			throw new DataFrameError(`cannot plot a scatterplot of the ${yColumnType} variable "${yColumnHeader}" against the ${xColumnType} variable "${xColumnHeader}"`)
		}
	}
	
	barchart(id,xColumnHeader,yColumnHeader,{xTitle = null,yTitle = null,barColours = null,barOutlineColours = null}={}){//id must not contain LaTeX subscripts
		var xTitle = xTitle || xColumnHeader
		var yTitle = yTitle || yColumnHeader
		var barColours = (barColours instanceof Array)? barColours : "default"
		var barOutlineColours = (barOutlineColours instanceof Array)? barOutlineColours : "default"
		var levels = this.factorLevelDict[xColumnHeader]
		var dataColumns = transpose(this.dataRows)
		var xCategoricalData = dataColumns[this.headerIndexDict[xColumnHeader]]
		var yContinuousData = dataColumns[this.headerIndexDict[yColumnHeader]]
		var newExpressions = []
		var state = Calc.getState()
		if (state.expressions.list.filter(x=>(x.id==`${id} data folder`)).length == 0){//if data expressions with this id are not already present in the calculator, add them
			newExpressions = generateDataExpressionsCategoricalByContinuous(id,levels,xCategoricalData,yContinuousData)
		}
		newExpressions = newExpressions.concat(generateBarchartExpressionsCategoricalByContinuous(id,levels,xTitle,yTitle,barColours,barOutlineColours))
		state.expressions.list = state.expressions.list.concat(newExpressions)
		Calc.setState(state,{allowUndo:true})
	}
	
	plot(id,xColumnHeader,yColumnHeader){
	//id should not contain any LaTeX subsripts (e.g.p_{lot1})
	//a good id could be something like "plot1"
		var xColumnType = this.headerTypeDict[xColumnHeader]
		var yColumnType = this.headerTypeDict[yColumnHeader]
		if (xColumnType == "continuous" && yColumnType == "continuous"){
			this.scatterplot(id,xColumnHeader,yColumnHeader)//the lines and points arguments cannot be passed to the DataFrame.plot() method, but their corresponding properties can me manually configured within desmos
		}
		else if (xColumnType == "categorical" && yColumnType == "continuous"){
			this.barchart(id,xColumnHeader,yColumnHeader)
		}
		else{
			throw new DataFrameError(`cannot plot the ${yColumnType} variable "${yColumnHeader}" against the ${xColumnType} variable "${xColumnHeader}"`)
		}
	}
	
	splot(id,xColumnHeader,yColumnHeader){//plot y against x and perform a statistical analysis of the model that y is predicted by x
	//id should not contain any LaTeX subsripts (e.g.p_{lot1})
	//a good id could be something like "plot1"
		var xColumnType = this.headerTypeDict[xColumnHeader]
		var yColumnType = this.headerTypeDict[yColumnHeader]
		if (xColumnType == "continuous" && yColumnType == "continuous"){
			this.scatterplot(id,xColumnHeader,yColumnHeader)//the lines and points arguments cannot be passed to the DataFrame.plot() method, but their corresponding properties can me manually configured within desmos
			Calc.setExpression({id: `${id} regression`, type: "expression", latex: `y_{${id}}\\sim k_{0${id}}+k_{1${id}}x_{${id}}`})
		}
		else if (xColumnType == "categorical" && yColumnType == "continuous"){
			this.barchart(id,xColumnHeader,yColumnHeader)
			this.ANOVA(id,xColumnHeader,yColumnHeader)
		}
		else{
			throw new DataFrameError(`cannot plot the ${yColumnType} variable "${yColumnHeader}" against the ${xColumnType} variable "${xColumnHeader}"`)
		}
	}
		
}

csvToDataFrame = function(csvRawText, csvContainsHeaderRow = true, columnHeaders = null,sep = ","){//columnHeaders : array of strings with length equal to the number of columns
	csvArray = csvTo2dArray(csvRawText, sep)
	if (csvContainsHeaderRow) {
		headerRow = csvArray[0]
		dataRows = csvArray.slice(1)//all rows except the first
	}
	else{
		headerRow = csvArray[0].map((x,i)=>i.toString())//name each column after its index
		dataRows = csvArray
	}
	if (columnHeaders){//if columnHeaders is specified, overwrite the current value of headerRow with it
		headerRow = columnHeaders
	}
	return new DataFrame(headerRow,dataRows)
}

desmosTableToDataFrame = function(id,mode = "raw"){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	headerRow = getTableColumnLabels(id)
	dataRows = getTableRows(id,mode)//in table manipulation toolkit v1.x this function has no mode argument but js should just ignore it so that should be fine. in v2.x the function should have the mode argument that can be set to "raw" to extract the raw string values, or "numerical" to extract the values to which the expressions in a table evaluate in desmos
	return new DataFrame(headerRow,dataRows)
}

subsetDesmosTable = function(id,conditionColumnLabel,conditionFunction,removeFactorFromSubset=false,plot=false,newid = "default",newColumnLabels = "default",mode="raw"){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	//id: Latex string, id of target table
	//conditionColumnLabel: Latex string, specifies the label of the column on which the conditionFunction will be evaluated to determine whether to include a given row in the subset
	//conditionFunction: function, must take in an item or (item,index) tuple and return a Boolean e.g. x => x>7 or (x,i) => i%2==0
	//removeFactorFromSubset: Boolean, specifies whether to remove the column on which the conditionFunction is being applied in the resulting subset (e.g. if the condition is to specify all values in this column must be equal to a target value, then this column becomes redundant and the user may wish to remove it by setting this argument to true)
	//plot: Boolean, specifies whether desmos should plot the points of the resulting subset table
	//newid: LaTeX string, except for default value ("default"), specifies the id of the subset table. If left as the default value, this will be the same as the id of the original table and the subset table will replace the original
	//newColumnLabels: array of LaTeX strings, except for default value ("default"), specifies the label that should be given to each column (in order from left to right). If left unchanged from its default value the columns will have the same labels as the original table. 
	//    if removeFactorFromSubset is set to true, the newColumnLabels array must have one less item than the number of column labels in the original table, otherwise an error will occur
	//    if newid has been specified and is different to id and newColumnLabels are not specified, this will result in clashing column labels between the orginal and new tables in desmos so this situation should be avoided. 
	//mode: string, takes values "raw" or "numerical" that determine whether the raw strings contained in the target table should be operated on or whether the numerical values those strings evaluate to in desmos should be operated on
	//    table manipulation toolkit (TMT) v1.x does not support the use of mode="numerical" so if the version of TMT is not 2.x or greater, leave the mode argument as its default value ("raw")
	
	dataFrame = desmosTableToDataFrame(id,mode)
	subsetDataFrame = dataFrame.subset(columnHeader = conditionColumnLabel,conditionFunction,removeFactorFromSubset)
	if (newid == "default") subsetid = id
	else subsetid = newid
	dataFrameToDesmosTable(subsetDataFrame,subsetid,plot,newColumnLabels)
}

//WARNING: Using the ToDesmosTable family of functions is not advised for large datasets as it may cause the page to crash
dataFrameToDesmosTable = function(dataFrame,id,plot=false,newColumnLabels = "default"){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	if (newColumnLabels == "default"){
		columnLabels = dataFrame.headerRow
		columnLabelsContainUnderscore = Boolean(columnLabels.map(labelString => labelString.search("_")!=-1).reduce((a,b)=>a+b))//the grossest line of code in this entire program probably
		if (!columnLabelsContainUnderscore)columnLabels = columnLabels.map(label => `c_{${label}}`)
	}
	else columnLabels = newColumnLabels
	dataColumns = transpose(dataFrame.dataRows)
	setTable(id,dataColumns,{columnLabels,plot})
}

csvToDesmosTable = function(csvRawText, id, headerRow = true, sep = ",", plot=false){
	if(typeof(id)!="string" || Boolean(id.match(/[^0-9A-Za-z]/))){//ensure id is a string composed only of letters and digits
		throw new DesmosIdError(`id must be a string containing only letters and digits, no spaces or punctuation\n	id type: ${typeof(id)}\nid: ${id}`)
	}
	dataFrameToDesmosTable(csvToDataFrame(csvRawText, csvContainsHeaderRow = headerRow, columnHeaders = null,sep),id,plot)
}
