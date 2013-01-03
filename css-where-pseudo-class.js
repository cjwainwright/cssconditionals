/**
Copyright (c) 2013, C J Wainwright, http://cjwainwright.co.uk

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// DOM selector, returns as array so can forEach etc.
function $(selector) {
    return Array.apply(null, document.querySelectorAll(selector));
}

// Utility DOM functions
var DOM = {
    toggleClass: function (el, className, on) {
        var currentClassName = el.className;
        var newClassName = currentClassName.replace(new RegExp('\\b' + className + '\\b', 'g'), '').replace(/^\s+/g, '').replace(/\s+$/g, '');
        if(on) {
            if(newClassName) {
                newClassName += ' ';
            }
            newClassName += className;
        }
        
        if(newClassName != currentClassName) {
            el.className = newClassName;
        }
    }
}

// Function to process the stylesheet
// Assumes pseudo :where() classes have already been re-written as standard classes in the form .where-style-comparator-value, e.g. .where-width-lt-500px
// For each condition, build a lookup (conditions) from this class name to the function which evaluates the condition on an element
// Store a lookup (rules) to these conditions from all CSS selectors which select the elements that need this condition applying
function parseStylesheet() {
    
    // create object containing data about parsed stylesheet to be returned from function
    var conditions = {};
    
    var noMatch = function(el) { return false; };
    var comparers = {
        eq: function(v1, v2){ return parseInt(v1) == parseInt(v2); },
        lt: function(v1, v2){ return parseInt(v1) < parseInt(v2); },
        gt: function(v1, v2){ return parseInt(v1) > parseInt(v2); },
        lteq: function(v1, v2){ return parseInt(v1) <= parseInt(v2); },
        gteq: function(v1, v2){ return parseInt(v1) >= parseInt(v2); }
    };

    // parse condition into a function that can be run on an element to evaluate the condition
    function createMatchMethod(condition) {
        var items = condition.split('-'); 
        if(items.length == 3) { 
            // assume of form 'style-comparator-value'
            var style = items[0], 
                comparer = comparers[items[1]],
                value = items[2];

            if(comparer == null) {
                return noMatch;
            }
            
            return function(el) { return comparer(getComputedStyle(el)[items[0]], items[2]); };
        }
        return noMatch;
    }
    
    // process selector, building up conditions and rules and adding to returned data
    function processSelector(selector) {
        do
        {
            var matched = false;
            selector = selector.replace(/\.where-([^\s]*)/, function(match, condition, index, str){ //TODO - need to handle other pseudo classes/elements after this one, currently assuming this is the last thing before the space
                matched = true;
                var selector = str.substr(0, index); // everything up to the where class. 
                var conditionClass = 'where-' + condition;
                var data = conditions[conditionClass];
                if(data == null) {
                    conditions[conditionClass] = data = {match: createMatchMethod(condition), selectors: []};
                }
                data.selectors.push(selector);
                
                return ''; //remove the where class from the selector before looking for further ones
            });
        }
        while(matched);
    }
    
    // iterate through stylesheets processing each selector
    for(var i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];
        for(var j = 0; j < styleSheet.cssRules.length; j++) {
            var cssRule = styleSheet.cssRules[j];
            var selectors = cssRule.selectorText.split(', ');
            for(var k = 0; k < selectors.length; k++) {
                processSelector(selectors[k]);
            }
        }        
    }

    return conditions;
}

// Processor to update class names on specified elements according to whether the conditions are met
function processor(conditions) {

    return function process() {
        for(var conditionClass in conditions) {
            if(conditions.hasOwnProperty(conditionClass)) {
                var data = conditions[conditionClass];
                $(data.selectors.join(', ')).forEach(function(el){
                    DOM.toggleClass(el, conditionClass, data.match(el));
                });
            }
        }
    }
}
    
// Really need to listen for changes on the element, but for now we'll just regularly update
setInterval(processor(parseStylesheet()), 400);