QUnit.test("namespaceTest", function(assert)
{
	assert.expect(3);

	assert.ok(window.Namespace, 'Namespace exists globally.');

	Namespace('Foo.Bar', function()
	{
		assert.ok(true, 'Foo.Bar is a valid function');
	});

	assert.ok(window.Foo.Bar, 'Foo.Bar exists globally.');

	Foo.Bar();
});

QUnit.test("classTest", function(assert)
{
	assert.expect(3);

	assert.ok(window.Class, 'Class exists globally.');

	Class('Foo.Bar.Baz', function()
	{
		this.init = Public(function()
		{
			assert.ok(true, 'Baz`s constructor ran.');
		});
	});

	assert.ok(window.Foo.Bar.Baz, 'Foo.Bar.Baz exists globally.');

	new Foo.Bar.Baz();
});

QUnit.test("publicTest", function(assert)
{
	assert.expect(2);

	assert.ok(window.Public, 'Public exists globally.');

	Class('publicTestClass', function()
	{
		this.IAmPublic = Public(function()
		{
			assert.ok(true, 'IAmPublic is accessible.');
		});
	});

	var instance = new publicTestClass();
	instance.IAmPublic();
});

QUnit.test("privateTest", function(assert)
{
	assert.expect(3);

	assert.ok(window.Private, 'Private exists globally.');

	Class('privateTestClass', function()
	{
		this.IAmPublic = Public(function()
		{
			this.ICanCallMyOwnPrivates();
		});

		this.ICanCallMyOwnPrivates = Private(function()
		{
			assert.ok(true, 'ICanCallMyOwnPrivates accessible from self.');
		});

		this.IAmPrivate = Private(function()
		{
			assert.ok(false, 'IAmPrivate should never be accessible.');
		});
	});

	var instance = new privateTestClass();
	instance.IAmPublic();
	assert.raises(function(){ instance.IAmPrivate(); }, 'IAmPrivate is not accessible.');
});

QUnit.test("extendTest", function(assert)
{
	assert.expect(11);

	assert.ok(window.Protected, 'Protected exists globally.');

	Class('extendTestClass1', function()
	{
		this.IAmPublic = Public(function()
		{
			assert.ok(true, 'IAmPublic is accessible.');
		});

		this.IAmProtected = Protected(function()
		{
			assert.ok(true, 'IAmProtected is accessible from child class.');
		});

		this.IAmPrivate = Private(function()
		{
			assert.ok(false, 'IAmPrivate should never be accessible.');
		});
	});

	Class('extendTestClass2', {extend: 'extendTestClass1'}, function()
	{
		this.IAmPublic2 = Public(function()
		{
			assert.ok(true, 'IAmPublic2 is accessible.');

			this.IAmProtected();

			assert.raises(function(){ this.IAmPrivate(); }, 'IAmPrivate is not accessible from child class.');
		});

		this.IAmPrivate2 = Private(function()
		{
			assert.ok(false, 'IAmPrivate2 should never be accessible.');
		});
	});

	var instance = new extendTestClass1();
	instance.IAmPublic();
	assert.raises(function(){ instance.IAmProtected(); }, 'IAmProtected is not accessible.');
	assert.raises(function(){ instance.IAmPrivate(); }, 'IAmPrivate is not accessible.');

	var instance = new extendTestClass2();
	instance.IAmPublic();
	instance.IAmPublic2();
	assert.raises(function(){ instance.IAmProtected(); }, 'IAmProtected is not accessible.');
	assert.raises(function(){ instance.IAmPrivate(); }, 'IAmPrivate is not accessible.');
	assert.raises(function(){ instance.IAmPrivate2(); }, 'IAmPrivate2 is not accessible.');
});