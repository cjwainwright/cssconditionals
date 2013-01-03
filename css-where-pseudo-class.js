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

// Mock function to process the stylesheet, for this return what would be the result of doing:
// Parse stylesheet
// Replace each :where(cond) with a unique class name e.g. .where-cond
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
setInterval(processor(parseStylesheet()), 1000);