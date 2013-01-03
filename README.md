JavaScript shim of proposed :where() CSS pseudo class
=====================================================

A JavaScript shim for a proposed :where() css pseudo class that can match elements conditionally
based on their computed style values. Like media queries, but for elements!

The proposal
------------

Media queries allow styles to be targeted at specific media features, such as available width and height.
However this often leads to a coupling of your individual HTML components in the page, to the page as a whole.

A simple example of the coupling is, say, a menu that switches from horizontal to vertical when it is below 
a certain width.
If we implement this functionality with media queries then we determine our break point by considering the width
of the menu at the point we want the break to happen, but then have to add in any other things that are inline
with the menu, e.g. a site logo. Changing the size of the logo then means we'd have to go in to our CSS and update
the media query break point, just to get our menu right.

What we'd like is for the menu styles to be self contained, it knows what size it should switch from being horizontal
to vertical. It shouldn't require the page to tell it. I want to be able to do something like

```css
.menu .menu-item {
    display: inline;
}

.menu:where(width < 500px) .menu-item {
    display: block;
}
```

This is the proposed `where:()` CSS pseudo class. It would work completely analogously to other pseudo classes, such
as `:hover()`, i.e. it allows you to refine your selector so that only elements matching the condition specified 
inside the brakets of the `:where()` contribute when trying to match the full selector.

In the above example, if a `.menu-item` is a child of a `.menu` element for which the [used value](https://developer.mozilla.org/en-US/docs/CSS/used_value)
of the width is less than `500px`, then the second rule will match, and take precedence over the first.

This allows components to be in and of themselves responsive, decoupled from the page, and thus portable. 
If I change the size of the logo sitting next to the menu I no longer need to delve around in my stylesheet 
updating my media query break points. The menu takes care of itself.

The JavaScript shim
-------------------

This project is intended to allow us to make use of such functionality, without it having been implemented in the CSS
engine. It shall work as follows

1. Process the stylesheet, replacing `:where()` pseudo classes with standard classes, a unique one for each distinct condition. For example `:where(width < 500px)` may become `.where-width-lt-500px`
2. Build a lookup of selectors from each condition in order to find elements on which we should toggle the condition className. E.g. in the example above we would store the `.menu` selector against the condition on the width allowing us to add or remove the `.where-width-lt-500px` class from all these elements depending on whether they satisfy the condition.
3. Listen for changes to elements that would cause the condition to need re-evaluation. On such a trigger we add or remove the condition classNames from the relevent elements, this process is to be recursive.

What works
----------

Currently step 1 is not implemented, you can however write a stylesheet with the condition class names directly, e.g. `.where-height-gteq-20px`.
Further, step 3 is not implemented, instead we are using a `setInterval` and every 400ms re-evaluating the conditions and updating the class names.
Step 2 is functional, which allows us to demonstrate this as a proof of concept.

There are problems that will need to be overcome. The recursrive nature of using the computed styles to determine 
the styles leads to the possibility of infinite loops, as in the following simple example

```css
#test {
    width: 50px;
}

#test:where(width < 100px) {
    width: 200px;
}
```

Further information
-------------------

Further information is available here http://cjwainwright.co.uk/webdev/cssconditionals/  
A demo is available here http://cjwainwright.co.uk/webdev/cssconditionals/sample/
