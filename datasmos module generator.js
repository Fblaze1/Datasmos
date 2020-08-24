generateModuleGenerator = function(expressionsList,idVariableName){
	JSONString = JSON.stringify(expressionsList,replacer=null,space="\t")//get expressions list as JSON string formatted nicely with tabs and newlines
	string = JSONString
		.replace(/`/g,'\\`')//escape all backticks by adding a backslash
		.replace(/\$/g,'\\$')//escape all dollar signs by adding a backslash
		.replace( /"(.*?)":/g , "$1:" )//turn {"property1":"stringValue1","property2":"stringValue2"... into {property1:"stringValue1",property2:"stringValue2"... 
		.replace( /"/g , "`" )//turn all strings into template literals; turn "string ${variable}" into `string ${variable}` 
		.replace(/^(\t*(?:id|folderId): `)(.*)(`,?)$/gm,`$1\${${idVariableName}} $2$3`)//add the idVariableName to all ids and folderIds (id: `1` -> id: `\${baseExpressionId}1` , assuming idVariableName="baseExpressionId")
		.replace(//replace the d in the differential operator in a derivative with a £ to stop it being recognised as a variable by subsequent replacement steps
			//this replacement is performed before the integral replacement to prevent the denominator of a derivative inside an integral from being recognised as the differential at the end of an integral as that would replace only the denominator d with a £ and not the numerator, breaking the derivative pattern and preventing the d in the numerator from being recognised
			// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/WPiuHe/11
			/(?<derivative>(?<extra_backslash>\\)?\\frac{(?<derivative_numerator_d>d)}{(?<derivative_denominator_d>d)(?<derivative_denominator_variable>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*})?)})/g
		,
			function derivativeReplacer(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				return ( groups["extra_backslash"] || "" ) + "\\frac{£}{£" + groups["derivative_denominator_variable"] + "}"
			}
		)
		.replace(//replace the letter d in any keywords or operatornames with a € to stop it being recognised by the integral replacer and to prevent this situation: https://regex101.com/r/MZXjME/2
			// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/iH5jLO/9
			/(?<greek_letter_or_false_derivative>(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma)))|(?<false_derivative>(?<operator_false_derivative>(?<head1>\\operatorname{[€a-zA-Z]*)d(?<tail1>[a-zA-Z][€a-zA-Z]*}))|(?<keyword_false_derivative>(?<head2>\\[€a-zA-Z]*?)d(?<tail2>[a-zA-Z]))))/g
		,	
			function falseDifferentialReplacer(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				
				falseDifferentialRegExp = /(?<greek_letter_or_false_derivative>(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|Theta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|Pi|rho|[Ss]igma|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma)))|(?<false_derivative>(?<operator_false_derivative>(?<head1>\\operatorname{[€a-zA-Z]*)d(?<tail1>[a-zA-Z][€a-zA-Z]*}))|(?<keyword_false_derivative>(?<head2>\\[€a-zA-Z]*?)d(?<tail2>[a-zA-Z]))))/g
				replacedMatch = match.replace(
					falseDifferentialRegExp
				,
					function falseDifferentialRecursiveReplacer(...args){
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let replacedMatch
						if (groups["greek_letter"]){
							replacedMatch = match
						}
						else{
							replacedMatch = ( groups["head1"] || groups["head2"] ) + "€" + ( groups["tail1"] || groups["tail2"] )
							//falseDifferentialRegExp already declared in the top level function falseDifferentialReplacer()
							let unreplacedMatchesRemain = replacedMatch.match(falseDifferentialRegExp)
							if (unreplacedMatchesRemain){//if there remain unreplaced false differentials, carry out the replacement again
								replacedMatch = replacedMatch.replace(
									falseDifferentialRegExp
								,
									falseDifferentialRecursiveReplacer
								)
							}
						}
						return replacedMatch
					}
				)
				return replacedMatch
			}
		)
		.replace(//replace the d in the differential operator in an integral with a £ to stop it being recognised as a variable by subsequent replacement steps
			//greedily search from the first integration bounds to the final differential to ensure no differentials are omitted from the match
			// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/FSC02v/7
			/(?<greedy_integral>(?<integration_bounds>\\?\\int_{.+?}\^{.+?})(?<full_integral_capture_group>.*)(?<last_differential_d>d)(?<last_differential_variable>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*})?))/g
		,//works with consecutive and nested integrals
			function integralReplacer(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				//lazily search from the first intregration bounds to the first differential to recognise differentials similarly to how desmos does
				// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/9Fu3eo/17
				integralRegExp = /(?<line_containing_lazy_integral>^(?<head>.*?)(?<lazy_integral>(?<integration_bounds>\\?\\int_{.+?}\^{.+?})(?<integrand>.*?)(?<first_differential_d>d)(?<first_differential_variable>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*})?))(?<tail>.*)$)/gm
				replacedMatch = match.replace(
					integralRegExp
				,
					function integralRecursiveReplacer(...args){
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let replacedMatch =  groups["head"] + groups["integration_bounds"] + groups["integrand"] + "£" + groups["first_differential_variable"] +groups["tail"]
						//integralRegExp already declared in the top level function integralReplacer()
						let unreplacedMatchesRemain = replacedMatch.match(integralRegExp)
						if(unreplacedMatchesRemain){//if there remain unreplaced integrals, carry out the replacement again
							replacedMatch = replacedMatch.replace(
								integralRegExp
							,
								integralRecursiveReplacer
							)
						}
						return replacedMatch
					}
				)
				return replacedMatch
			}
			//'$1$<integration_bounds>$<integrand>£$<differential_variable>$5'
		)
		.replace(/€/g,"d")//replace € back to d
		.replace(//add empty subscript to variables (Latin alphabet letters or Greek letters) in the latex attribute of an expression
			/^(?<head>\t*latex: `)(?<latex>.*)(?<tail>`,?)$/gm
		,
			function latexEmptySubscriptAdder(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				replacedLatex = groups["latex"].replace(
					// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/fp6sY4/11
					/(?<latex_subunit>(?<do_not_replace>(?<operator>\\?\\operatorname{[a-zA-Z]+})|(?<keyword>(?!(?<exclude_greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))\\?\\[a-zA-Z]+)|(?<letter_and_subscript>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*}))|(?<irreplaceable_greek_letter>\\?\\(?:pi|tau|theta)))|(?<replaceable_letter>(?<latin_letter_except_ertxy>[a-df-qsuvwzA-Z])|(?<greek_letter_except_pi_tau_theta>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|Theta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|Pi|rho|[Ss]igma|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma)))))/g
				,
					function latexSubunitReplacer(...args){
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let replacedLatexSubunit
						if (groups["replaceable_letter"]){
							replacedLatexSubunit = match + "_{}"
						}
						else{
							replacedLatexSubunit = match
						}
						return replacedLatexSubunit
					}
				)
				replacedMatch = groups["head"] + replacedLatex + groups["tail"]
				return replacedMatch
			}
		)
		.replace(//add empty subscript to letter variables (Latin alphabet letters or Greek letters) in the values attribute of a table column expression
			// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/TBd8SA/1
			/(?<head>values: \[)(?<latexList>(?:.|\n)*?)(?<tail>\](?:,|}))/g
		,
			function tableColumnValuesReplacer(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				replacedValues = groups["latexList"].replace(
					// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/mikOEd/1
					/^(?<head>\t*`)(?<latex>.*?)(?<tail>`,?$)/gm
				,
					function latexEmptySubscriptAdder(...args){
					//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let replacedLatex = groups["latex"].replace(
							// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/fp6sY4/11
							/(?<latex_subunit>(?<do_not_replace>(?<operator>\\?\\operatorname{[a-zA-Z]+})|(?<keyword>(?!(?<exclude_greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))\\?\\[a-zA-Z]+)|(?<letter_and_subscript>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*}))|(?<irreplaceable_greek_letter>\\?\\(?:pi|tau|theta)))|(?<replaceable_letter>(?<latin_letter_except_ertxy>[a-df-qsuvwzA-Z])|(?<greek_letter_except_pi_tau_theta>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|Theta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|Pi|rho|[Ss]igma|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma)))))/g
						,
							function latexSubunitReplacer(...args){
								let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
								let match = args[0]//                   The matched substring
								let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
								let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
								let string = args[offsetArgumentIndex+1]//The whole string being examined
								let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
								let replacedLatexSubunit
								if (groups["replaceable_letter"]){
									replacedLatexSubunit = match + "_{}"
								}
								else{
									replacedLatexSubunit = match
								}
								return replacedLatexSubunit
							}
						)
						replacedMatch = groups["head"] + replacedLatex + groups["tail"]
						return replacedMatch
					}
				)
				return groups["head"]+ replacedValues +groups["tail"]
			}
		)
		.replace(//add empty subscript to letter variables enclosed in a "${}" in the label attribute of an expression (only targets Latin alphabet letters since desmos doesn't recognise greek letters or other latex keywords in labels unless they're enclosed by backticks in which case they are parsed as latex for rendering but are not interpreted as expressions) 
			/^(?<head>\t*label: `)(?<label>.*)(?<tail>`,?)$/gm
		,
			function labelEmptySubscriptAdder(...args){
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				replacedLabel = groups["label"].replace(//this replacement captures all text enclosed by ${} and adds an empty subscript if there was no subscript already present, otherwise it leaves it unchanged 
					// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/9GOYSb/4
					/(?<label_embedded_latex>\${(?<latin_letter>[a-zA-Z])(?<subscript>_{[a-zA-Z0-9]*})?})/g
				,
					function labelReplacer(...args){
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let subscript = groups["subscript"] || "_{}" //use the subscript found in the regular expression if there was one, otherwise add an empty subscript
						let replacedMatch = "${" + groups["latin_letter"] + subscript + "}"
						return replacedMatch
					}
				)
				replacedMatch = groups["head"] + replacedLabel + groups["tail"]
				return replacedMatch
			}
		)
		.replace(//replace the regressionParameters attribute for a regression expression by adding an empty subscript to the keys without a subscript and enclosing the keys in backticks and square brackets
		//for desmos regression expressions, the regressionParameters attribute is an object whose keys are the latex strings of the regression parameter names, which need to be handled as any other latex variable, adding the idVariableName as a subscript
		//to have a dynamic value dependent on the value of idVariableName as the key in an object, the template literal must be embedded in square brackets
		//links: https://stackoverflow.com/questions/49068757/can-i-use-template-string-on-object-key-in-es6?noredirect=1&lq=1 https://stackoverflow.com/questions/33194138/template-string-as-object-property-name
			// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/AeoJnt/1
			/(?<head>regressionParameters: {)(?<object>(?:.|\n)*?)(?<tail>},?\n)/g
		,
			function regressionParametersReplacer(...args){//regression parameters will be a Latin or Greek letter optionally followed by a subscript containing any number of digits and Latin letters
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				replacedRegressionParameters = groups["object"].replace(
					// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/rFqlWJ/2
					/^(?<head>\t+)(?<key>.*)(?<tail>:.*,?$)/gm
				,
					function keyReplacer(...args){
						let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
						let match = args[0]//                   The matched substring
						let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
						let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
						let string = args[offsetArgumentIndex+1]//The whole string being examined
						let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
						let replacedKey = groups["key"].replace(
							// to explore what this regular expression does in regex101, open the following link: https://regex101.com/r/fp6sY4/11
							/(?<latex_subunit>(?<do_not_replace>(?<operator>\\?\\operatorname{[a-zA-Z]+})|(?<keyword>(?!(?<exclude_greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))\\?\\[a-zA-Z]+)|(?<letter_and_subscript>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*}))|(?<irreplaceable_greek_letter>\\?\\(?:pi|tau|theta)))|(?<replaceable_letter>(?<latin_letter_except_ertxy>[a-df-qsuvwzA-Z])|(?<greek_letter_except_pi_tau_theta>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|Theta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|Pi|rho|[Ss]igma|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma)))))/g
						,
							function latexSubunitReplacer(...args){
								let offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
								let match = args[0]//                   The matched substring
								let p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
								let offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
								let string = args[offsetArgumentIndex+1]//The whole string being examined
								let groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
								let replacedLatexSubunit
								if (groups["replaceable_letter"]){
									replacedLatexSubunit = match + "_{}"
								}
								else{
									replacedLatexSubunit = match
								}
								return replacedLatexSubunit
							}
						)
						return groups["head"]+ "[`" + replacedKey + "`]" +groups["tail"]
					}
				)
				replacedMatch = groups["head"] + replacedRegressionParameters + groups["tail"]
				return replacedMatch
			}
		)
		.replace(//add the idVariableName to the end of each subscript unless that subscript forms part of the integration bounds for an integral
			// to explore what this regular expression does in regex101, open the the following link: https://regex101.com/r/wT91hH/4
			/(?<keyword_or_letter_and_subscript>(?<keyword_capture>(?!(?<exclude_greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))\\?\\[a-zA-Z]+)|(?<letter_and_subscript>(?<letter>(?<latin_letter>[a-zA-Z])|(?<greek_letter>\\?\\(?:alpha|[bz]?eta|(?:dig|g|G)amma|[Dd]elta|[Uue]psilon|[Tt]heta|iota|kappa|[Ll]ambda|[mn]u|[Xx]i|[Pp]i|rho|[Ss]igma|tau|[Pp][hs]i|chi|[Oo]mega|var(?:epsilon|theta|rho|ph?i|kappa|sigma))))(?<subscript>_{[a-zA-Z0-9]*})))/g
		,
			function addIdVariableNameToSubscript(...args){//requires idVariableName global variable
			//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
				offsetArgumentIndex = args.findIndex(x=>typeof(x)=="number")//the only numerical argument will be the offset argument, the index of which will be used to establish the indices of the other arguments
				match = args[0]//                   The matched substring
				p = args.slice(1,offsetArgumentIndex)//p[n] = The nth string found by a parenthesized capture group (including named capturing groups), provided the first argument to replace() was a RegExp object
				offset = args[offsetArgumentIndex]//The offset of the matched substring within the whole string being examined
				string = args[offsetArgumentIndex+1]//The whole string being examined
				groups = args[offsetArgumentIndex+2]//In browser versions supporting named capturing groups, will be an object whose keys are the used group names, and whose values are the matched portions (undefined if not matched)
				if (groups["keyword_capture"]){
					return groups["keyword_capture"]
				}
				else{
					let letterAndSubscriptWithoutClosingCurlyBracket = groups["letter_and_subscript"].slice(0,-1)
					let stringToInsert = "${" +idVariableName+ "}"
					return  letterAndSubscriptWithoutClosingCurlyBracket + stringToInsert+ "}"
				}
			}
		)
		.replace(/£/g,"d")//replace £ back to d
		.replace(/`(.*)(\$\{id})(.*)=[\-0-9.]+`/g,'`$1$2$3=\${defaultValues["$1$3"]}`')//replace desmos variable assignments with default values
	return string
}

generateDefaultValues = function(string){
	defaultValues = Object.fromEntries(
		[...string.matchAll(
			/`(.*)(\$\{id})(.*)=\${defaultValues\["(?<variable_name>.*)"\]}`/g)//match all variable assignments that refer to defaultValues
		].map(
			match=>
			[
				match.groups["variable_name"]
			,
				1//set default values to 1
			]
		)//extract variable names
	)
	defaultValuesString = JSON.stringify(defaultValues,null,"\t")
	return defaultValuesString
}

expressionsListString = generateModuleGenerator(Calc.getState().expressions.list,"id")
defaultValuesString = generateDefaultValues(expressionsListString)

functionString = `
generateModule = function (id){
	defaultValues = ${defaultValuesString.replace(/^(\t*)/gm,"\t$1")}
	
	expressionsList = ${expressionsListString.replace(/^(\t*)/gm,"\t$1")}
	
	return expressionsList
}

`

//functionString = functionString.replace(/$(\t)*(?!generateModule = function)/gm,"\t$1")//add an extre indentation every line except the function definition line
console.log(functionString)
copy(functionString)//copy to clipboard
