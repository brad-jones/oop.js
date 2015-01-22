/**
 * Classes for browsers
 * =============================================================================
 * Like many others this is my attempt at creating a "classical" class in
 * javascript. My motivations are because I like the look of a traditional
 * class. A prototype class is just so segmented and verbose. Thats really all
 * it comes down to because I could have fixed my IE bugs by dropping Writh's
 * classical and just doing everything in native code. I felt like that was
 * giving in though.
 * 
 * As mentioned above I was using and still do use the classical project from:
 * https://github.com/Writh/classical
 * 
 * So the overall API is similar but the implementation is widely different.
 * 
 * I also gained inspiration from John Resig's version of Class.
 * http://ejohn.org/blog/simple-javascript-inheritance/
 * 
 * And other frameworks such as Prototype, Mootools, etc
 * 
 * !!!DID I MENTION THIS WORKS IN IE6+!!!
 * Okay maybe thats not a huge deal anymore but it still felt like an
 * achievement when I got it working. Its sad I know but I have to build
 * websites to work in IE7+, that was my goal and I achieved it plus some.
 * 
 * Performace wise I have not yet benchmarked this, it's on my TODO list along
 * with some unit tests and other surrounding goodies. But I do have it running
 * in the wild. Okay I havn't defined 100's of classes but it does the job I
 * wanted it to do.
 * 
 * Cheers Brad Jones <brad @="bjc.id.au" />
 * MIT Licensed.
 */
(function()
{
	/**
	 * Function: Namespace
	 * =========================================================================
	 * I am going to call this a language construct. Its not really, it's just
	 * a function. But it will end up being used like a namespace construct
	 * from say PHP or other classical languages.
	 * You can use it like so:
	 * 
	 * Namespace('brads.cool.namespace.foo', function(){ console.log('foo'); });
	 * brads.cool.namespace.foo();
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * name - the full name of the class, function or object, value, etc
	 * value - the class, function or object, value, etc
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * void
	 */
	window.Namespace = function(name, value)
	{
		// Add the new namespace to the global scope
		var base = window;

		// Split the name up
		var names = name.split('.');

		// Remove the last name and keep it for later
		var lastName = names.pop();

		// Walk the hierarchy, creating new objects where needed.
		// If the lastName was removed, then the last object is not set yet:
		for (var i = 0; i < names.length; i++)
		{
			base = base[names[i]] = base[names[i]] || {};
		}

		// If a value was given, set it to the last name:
		if (lastName)
		{
			base = base[lastName] = value;
		}
	};

	/**
	 * Function: Public
	 * =========================================================================
	 * We are going to add another language construct to the global scope.
	 * This sets the scope or visibility of our class members.
	 * You can use it like so:
	 * 
	 * Class('Foo', function()
	 * {
	 * 		this.bar = Public(function()
	 * 		{
	 * 			console.log('I AM A PUBLIC MEMBER OF Foo');
	 * 		});
	 * });
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * member - the member to make public
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * object
	 */
	window.Public = function(member)
	{
		return { member : member, scope : 'Public', _static: false };
	};

	/**
	 * Function: Protected
	 * =========================================================================
	 * Same as Public but for shared members between class hierarchies.
	 * 
	 * Class('Foo', function()
	 * {
	 * 		this.bar = Protected(function()
	 * 		{
	 * 			console.log('I AM A PROTECTED MEMBER OF Foo');
	 * 		});
	 * });
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * member - the member to make protected
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * object
	 */
	window.Protected = function(member)
	{
		return { member : member, scope : 'Protected', _static: false };
	};

	/**
	 * Function: Private
	 * =========================================================================
	 * Same as Public but for private members of a class.
	 * 
	 * Class('Foo', function()
	 * {
	 * 		this.bar = Private(function()
	 * 		{
	 * 			console.log('I AM A PRIVATE MEMBER OF Foo');
	 * 		});
	 * });
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * member - the member to make private
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * object
	 */
	window.Private = function(member)
	{
		return { member : member, scope : 'Private', _static: false };
	};

	/**
	 * Function: Static - TODO
	 * =========================================================================
	 * NOTE: This is comming soon, this is not yet actually implemented.
	 * 
	 * This provides a static language construct, same idea as the
	 * Public, Protected and Private functions.
	 * 
	 * Class('Foo', function()
	 * {
	 * 		this.bar = Static(Private(function()
	 * 		{
	 * 			console.log('I AM A PRIVATE MEMBER OF Foo');
	 * 		}));
	 * });
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * member - the member to make static
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * object
	 */
	window.Static = function(member)
	{
		member._static = true; return member;
	};

	// This is our private registry of all our methods
	// for every class ever defined. This is used so we can apply the correct
	// scope to each method. I guess this is kind of like the prototype chain
	// but with Protected and Private members. Can I use the prototype chain
	// and still maintain the privacy????? Anyway for now this works.
	var registry = {};

	/**
	 * Function: Class
	 * =========================================================================
	 * And this is the much anticipated javascript class language construct.
	 * A basic class might look like this:
	 * 
	 * 	Class('Foo', function()
	 *	{
	 *		this.age = Public(26);
	 *
	 *		this.init = Public(function()
	 *		{
	 *			console.log('Foo.init');
	 *		});
	 *		
	 *		this.setAge = Public(function()
	 *		{
	 *			this.age = 100;
	 *		});
	 *
	 *		this.abc = Public(function()
	 *		{
	 *			console.log('Foo.abc');
	 *			this.bar();
	 *		});
	 *		
	 *		this.xyz = Protected(function()
	 *		{
	 *			console.log('Foo.xyz');
	 *			this.bar();
	 *		});
	 *		
	 *		this.bar = Private(function()
	 *		{
	 *			console.log('Foo.bar');
	 *		});
	 *	});
	 * 
	 * An extended class:
	 * 
	 *	Class('FooBar', {extend:'Foo'}, function()
	 *	{
	 *		this.init = Public(function()
	 *		{
	 *			console.log('FooBar.init');
	 *		});
	 *		
	 *		this.abc = Public(function($parent, other, args, can, go, here)
	 *		{
	 *			console.log('FooBar.abc');
	 *			console.log('other arg: '+other);
	 *			$parent();
	 *		});
	 *		
	 *		this.yam = Public(function()
	 *		{
	 *			console.log('FooBar.yam');
	 *			this.xyz();
	 *		});
	 *		
	 *		this.silly = Public(function()
	 *		{
	 *			console.log('FooBar.silly');
	 *			this.bar();
	 *		});
	 *	});
	 *	
	 * And example usage:
	 * 	
	 *	// We are testing the context here
	 *	var test1 = new Foo();
	 *	console.log(test1);	// note: age = 26
	 *	test1.setAge();		// now age has been set to 100
	 *	console.log(test1);	// age should = 100
	 *
	 *	// New instance of Foo
	 *	var test2 = new Foo();
	 *	console.log(test2);	// Age should be 26 again
	 *	test2.abc(); // Foo.abc, Foo.bar
	 *
	 *	// Testing Protected
	 *	try
	 *	{
	 *		test2.xyz(); // fails
	 *	}
	 *	catch(e)
	 *	{
	 *		console.log(e.message); // undefined is not a function
	 *	}
	 *
	 *	// Testing Private
	 *	try
	 *	{
	 *		test2.bar(); // fails
	 *	}
	 *	catch(e)
	 *	{
	 *		console.log(e.message); // undefined is not a function
	 *	}
	 *
	 *	// Create a FooBar
	 *	var test3 = new FooBar();
	 *	test3.abc('123'); // FooBar.abc, other arg: 123, Foo.abc, Foo.bar
	 *	test3.yam(); // FooBar.yam, Foo.xyz, Foo.bar
	 *
	 *	try
	 *	{
	 *		test3.silly(); // FooBar.silly and then fails...
	 *	}
	 *	catch(e)
	 *	{
	 *		console.log(e.message); // undefined is not a function
	 *	}
	 * 
	 * Parameters:
	 * -------------------------------------------------------------------------
	 * member - the member to make private
	 * 
	 * Returns:
	 * -------------------------------------------------------------------------
	 * object
	 */
	window.Class = function()
	{
		// Get some arguments
		var class_name = arguments[0];
		if (typeof arguments[1]['extend'] != 'undefined')
		{
			var parent_class_name = arguments[1]['extend'];
			var local_members = new arguments[2];
		}
		else
		{
			var parent_class_name = null;
			var local_members = new arguments[1];
		}

		// Create some containers
		var public_members = {};
		var protected_members = {};
		var private_members = {};

		// Sort our members
		for(var name in local_members)
		{
			switch(local_members[name]['scope'])
			{
				case 'Public': public_members[name] = local_members[name]['member']; break;
				case 'Protected': protected_members[name] = local_members[name]['member']; break;
				case 'Private': private_members[name] = local_members[name]['member']; break;
			}
		}

		// Add our members to the registry for later use by child classes
		registry[class_name] =
		{
			class_name: class_name,
			parent_class_name: parent_class_name,
			public_members: public_members,
			protected_members: protected_members,
			private_members: private_members
		};

		// Private helper function
		// Simple and easy, this just mashes a few objects together
		// Todo: make this use arguments, instead of obj1,obj2,obj3,etc
		function merge(obj1,obj2,obj3,obj4,obj5,obj6)
		{
			var obj7 = {};
			for (var attrname in obj1) { obj7[attrname] = obj1[attrname]; }
			for (var attrname in obj2) { obj7[attrname] = obj2[attrname]; }
			for (var attrname in obj3) { obj7[attrname] = obj3[attrname]; }
			for (var attrname in obj4) { obj7[attrname] = obj4[attrname]; }
			for (var attrname in obj5) { obj7[attrname] = obj5[attrname]; }
			for (var attrname in obj6) { obj7[attrname] = obj6[attrname]; }
			return obj7;
		}

		// Keep a context or state of the class
		var context = {};

		// Called by the class constructor to fill the class with it's methods.
		function assemble(instance, definition)
		{
			// Here is the recursive part
			var all_protected_members = {};
			if (definition.parent_class_name != null)
			{
				all_protected_members = assemble
				(
					instance, registry[definition.parent_class_name]
				);
			}

			// This returns the context for each method call
			function create_context()
			{
				var protected_context = {};

				for(var x in context)
				{
					if (typeof all_protected_members[x] != 'undefined')
					{
						protected_context[x] = context[x];
					}

					if (typeof definition.private_members[x] != 'undefined')
					{
						protected_context[x] = context[x];
					}
				}

				return merge
				(
					definition.public_members,
					definition.protected_members,
					definition.private_members,
					all_protected_members,
					instance,
					protected_context
				);
			}

			// This creates a new member to be added to the class
			function create_member(member)
			{
				// Is the member a function or another simple type
				if (typeof member == 'function')
				{
					return function()
					{
						// Create the context for the method call
						context = create_context();

						// Call the member
						var ret = member.apply(context, arguments);

						// Update the instance with any changes from the context
						for (var key in context)
						{
							// We only care about public properties
							if (typeof instance[key] != 'undefined')
							{
								if (typeof instance[key] != 'function')
								{
									instance[key] = context[key];
								}
							}
						}

						// Return the value from the member call
						return ret;
					};
				}
				else
				{
					// Just return it, we don't need to do anything special
					return member;
				}
			}

			// This creates a new member that already has a parent in the class
			function create_child_member(member, parent_member)
			{
				// Is the member a function or another simple type
				if (typeof member == 'function')
				{
					return function()
					{
						// Create the context for the method call
						context = create_context();

						// Lets grab the arguments and turn it into a real array
						var args = Array.prototype.slice.call(arguments);

						// Add the parent member in as the first argument
						args.unshift(parent_member);

						// Call the new member
						// The first argument will be the parent member.
						// But keep in mind the outside world does not know
						// about this first argument that has been sliced in.
						var ret = member.apply(context, args);

						// Update the instance with any changes from the context
						for (var key in context)
						{
							// We only care about public properties
							if (typeof instance[key] != 'undefined')
							{
								if (typeof instance[key] != 'function')
								{
									instance[key] = context[key];
								}
							}
						}

						// Return the value from the member call
						return ret;
					};
				}
				else
				{
					// Just return it, we don't need to do anything special.
					// Overwrites the parent value.
					return member;
				}
			}

			// Add the public methods to the instance
			for (var name in definition.public_members)
			{
				if (typeof instance[name] == 'undefined' || String(instance[name]).indexOf('/* klass:') > 0)
				{
					instance[name] = create_member
					(
						definition.public_members[name]
					);
				}
				else
				{
					instance[name] = create_child_member
					(
						definition.public_members[name],
						instance[name]
					);
				}
			}

			// Add any new protected members
			for (var name in definition.protected_members)
			{
				if (typeof all_protected_members[name] == 'undefined')
				{
					all_protected_members[name] = create_member
					(
						definition.protected_members[name]
					);
				}
				else
				{
					all_protected_members[name] = create_child_member
					(
						definition.protected_members[name],
						all_protected_members[name]
					);
				}
			}

			// Wrap the private methods such that they get called
			// with the correct context at all times.
			for (var name in definition.private_members)
			{
				definition.private_members[name] = create_member
				(
					definition.private_members[name]
				);
			}

			// Bubble our protected methods up the chain
			return all_protected_members;
		}

		// Create new class
		var klass = function()
		{
			/* klass: SPECIAL COMMENT DO NOT REMOVE */

			// fill the class with it's methods
			assemble(this, registry[class_name]);

			// run the constructor
			// NOTE: We have to use `init` for the pseudo constructor method
			// name because of IE otherwise I was using constructor which
			// seemed more semantic too me.
			if (this.init) this.init.apply(this, arguments);
		};

		// Publish it
		Namespace(class_name, klass);
	};
})();