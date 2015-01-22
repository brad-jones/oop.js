Oop.js - A Class Construct for the Browser
================================================================================
[![Sauce Test Status](https://saucelabs.com/browser-matrix/oopjs.svg)](https://saucelabs.com/u/oopjs)

Like many others this is my attempt at creating a "classical" class in
javascript. My motivations are because I like the look of a traditional class.
A prototype class is just so segmented and verbose. Thats probably a little
niave and short sighted but it works for me, so it might for others.

__DID I MENTION THIS WORKS IN IE6+__
Okay maybe thats not a huge deal anymore but it still felt like an achievement
when I got it working. Its sad I know but I have to build websites to work in
IE7+, that was my goal and I achieved it plus some.

_NOTE: While this will probably work just fine in Node, I have a dedicated
package that provides basically the same thing plus some additonal Node
functionality. Go and checkout: https://github.com/brad-jones/globalise_

How to Install
--------------------------------------------------------------------------------
Installation via bower is easy:

	bower install --save oop.js

How to Use:
--------------------------------------------------------------------------------
Once you have the main oop.js script included into your page
you can define classes like this:

```js
Class('Foo', function()
{
	this.age = Public(26);

	this.init = Public(function(name)
	{
		alert('Hello ' + name);
	});
});

var instance = new Foo('Brad');
instance.age == 26
```

You can create namespaced classes like this:

```js
Class('Foo.Bar', function()
{
	this.init = Public(function()
	{
		alert('I am Foo.Bar');
	});
});

new Foo.Bar();
```

You can create private members:

```js
Class('Foo', function()
{
	this.secret = Private('spooky confidential stuff');

	this.cantTouchMyPrivates = Private(function()
	{
		alert('This can not be called froim the outside world!');
	});
});

var instance = new Foo();
instance.secret; // results in an exception
instance.cantTouchMyPrivates(); // results in an exception
```

You can extend a class and create protected members.

```js
Class('Foo', function()
{
	this.onlyBarCanCallMe = Protected(function()
	{
		alert('Hello Bar, hows it going?');	
	});
});

Class('Bar', {extend:'Foo'}, function()
{
	this.callProtected = Public(function()
	{
		this.onlyBarCanCallMe();
	});
});

var instance = new Bar();
instance.onlyBarCanCallMe(); // results in an exception
instance.callProtected(); // Foo asks bar how he is going.
```

You can easily create namespaced functions like so:

```js
Namespace('Foo.Bar.Baz', function(a, b)
{
	return a + b;
});

Foo.Bar.Baz(1, 2); // results in 3
```

_NOTE: You do not need to namespace your classes.
The ```Class()``` construct calls the ```Namespace()``` function for you._

Credits:
--------------------------------------------------------------------------------
Intial ideas and the public facing API basically remains as it is from:
https://github.com/Writh/classical

Also got some inspiration from Johns Class:
http://ejohn.org/blog/simple-javascript-inheritance/

--------------------------------------------------------------------------------
Developed by Brad Jones - brad@bjc.id.au
