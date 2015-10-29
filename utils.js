"use strict";

/**
	Utils.js
	A collection of useful basic utilities for JavaScript
	
	* Contents *

	* Extensions *

	* Classes *
		* Internal names -- mark or test names as internal
		* AbstractSuper -- a super class for all classess ( and all seasons )
		* Privates -- extend this to make a privates class for some other class
		* IterablePrivates -- privates for iterators ( a values array an an iterator )
		* AbstractIterable -- a super class( iterable_privates_key ) that provides ( values, Symbol.iterator, length ) to its subclasses
		* Queue -- a queue ( bound, ...items ), with back and front accessors, and join and next methods.
		* Stack -- a stack ( ...items ), with top and bottom accessors, and push and pop inherited methods.
		* Enum -- an enumerable type ( 'name1 name2 ...' )
		* range -- a range( low, high ), an array of all values from >= low to < high  

	* Utility Functions *

	* Ideas & Improvements *
	* For iterable classes ( not these basic types )
	* in future it works to multiple inherit one of those being from an IterableSuper class
	* That has an iterator method that handles getting the iterator for the values *
*/	

// Basics
	{
		// Internal names
		// mark names as internal

		const internally_marked_regex = /\[\[[^\[\]]+\]\]/;

		function internal_name( name ) {
			return `[[${ name }]]`;
		}

		function internally_marked( string ) {
			return internally_marked_regex.test( string );
		}

		self.internal_name = internal_name;
		self.internally_marked = internally_marked;
	}

// Extensions 
	{
		// extensions 
		const extension = ( thing, name, descriptor ) => {
			const extension_key = internal_name( 'Extension' );
			if( ! thing.hasOwnProperty( extension_key ) ) thing[ extension_key ] = new Set();
			if( thing[ extension_key ].has( name ) ) throw new TypeError( `${ thing } already has an extension called ${ name }` );
			else { 
				Object.defineProperty( thing, name, descriptor );
				thing[ extension_key ].add( name );
			}
		};
		self.extension = extension;
	}
	{
		class ThrownTypeError extends TypeError {
			constructor( msg ) {
				super( `Invalid ${ msg }` ); 
				this.stack = this.stack.split( /\n\s*/g ); 
				throw this;
			}
		}

		extension( self, 'ThrownTypeError', { get : () => ThrownTypeError } );
	}
	{
		// with for object 
		// use object assign 

		extension( Object.prototype, 'with', { 
			value : function __with__( ...objs ) {
				objs.unshift( this );
				Object.assign( ...objs );
				return this;
			}
		} ); 
	}
	{
		// property definition macros

		const makehidden = ( obj, prop, descriptor ) => Object.defineProperty( obj, prop, descriptor.with( { enumerable: false } ) ),
			makevisible = ( obj, prop, descriptor ) => Object.defineProperty( obj, prop, descriptor.with( { enumerable: true } ) );
		
		self.makehidden = makehidden;
		self.makevisible = makevisible;
	}
	{
		// Object.getOwnPropertyDescriptors ( plural ) extension  (includes 'true' for Symbols );

		extension( Object.prototype, 'getOwnPropertyDescriptors', {
			value : function __descriptors__( obj, symbols ) {
				const names = Object.getOwnPropertyNames( obj ).concat( symbols ? Object.getOwnPropertySymbols( obj ) : [] ),
					descriptors = names.map( name => ( { name, definition : Object.getOwnPropertyDescriptor( obj, name ) } ) );
				return descriptors;
			}	
		} );
	}
	{
		// Array methods for NodeList
		// this means that now things returned by querySelector have array super powers
		if( self.NodeList ) NodeList.prototype.__proto__ = Array.prototype;
	}
	{
		// has for Array
		// ~ maps -1 to 0
		// !! maps 0 to false and non-zero to true

		function has( member ) { 
			return !!~this.indexOf( member );
		}

		extension( Array.prototype, 'has', { get : () => has } );
	}
	{
		// last for Array
		extension( Array.prototype, 'last', { get : function() { return this[ this.length - 1 ]; } } );
	}
	{
		// first for Array
		extension( Array.prototype, 'first', { get : function() { return this[ 0 ]; } } );
	}
	{
		// pop first alias drop for array
		extension( Array.prototype, 'popfirst', { value : function () { return this.shift() } } );
		extension( Array.prototype, 'drop', { value : function () { return this.shift() } } );
	}
	{
		// push first alias suck for array
		extension( Array.prototype, 'pushfirst', { value : function( ...vals ) { return this.unshift( ...vals ) } } ); 
		extension( Array.prototype, 'suck', { value : function( ...vals ) { return this.unshift( ...vals ) } } ); 
	}
	{
		// includes for array
		extension( Array.prototype, 'includes', { value : function( val ) { return this.indexOf( val ) !== -1 } } );
	}
	{
		// setImmediate
		const tasks = {};

		let handle = 0;

		function setImmediateWindow( fn ) {
			tasks[ ++handle ] = fn;
			self.postMessage( handle, '*' );		
			return handle;
		}

		function setImmediateWorker( fn ) {
			tasks[ ++handle ] = fn;
			self.postMessage( { task : handle } );		
			return handle;
		}

		function run_task_window( message ) {
			const handle = message.data,
				task = tasks[ handle ];
			if( task ) task();
			tasks[ handle ] = () => 0;;
		}

		function run_task_worker( message ) {
			const handle = message.data.task,
				task = tasks[ handle ];
			if( task ) task();
			tasks[ handle ] = () => 0;;
		}	

		self.addEventListener( 'message', self.Window ? run_task_window : run_task_worker , false );
		self.setImmediate = self.Window ? setImmediateWindow : setImmediateWorker;
	}
	{
		// querySelector and querySelectorAll aliases to 'the' and 'of'
		if( self.Document ) {
			extension( Document.prototype, 'the', { get : function() { return this.querySelector; } } );
			extension( Document.prototype, 'of', { get : function() { return this.querySelectorAll; } } );
			extension( self, 'the', { value : q => document.the(q) } );
			extension( self, 'of', { value : q => document.of(q) } );
		}
	}
	{
		// add listener to multiple events
		function on( names, fn ) {
			names.split( /\s+/g )
				.filter( name => name.length )
				.forEach( name => this.addEventListener( name, fn ) );	
		}
		if( self.Node ) {
			extension( Node.prototype, 'on', { value : on } );
		}
		extension( self, 'on', { value : on } );
	}
	{
		// add listener to multiple elements 
		if( self.NodeList ) {
			function on_all( names, fn ) {
				this.forEach( elem => elem.on( names, fn ) );
			}
			extension( NodeList.prototype, 'on', { value : on_all } );
		}
	}
	{
		// getAttribute, setAttribute, hasAttribute aliased to get, set and has
		if( self.Element ) {
			extension( Element.prototype, 'has', { value : function( name ) { return this.hasAttribute( name ) } } );
			extension( Element.prototype, 'get', { value : function( name ) { return this.getAttribute( name ) } } );
			extension( Element.prototype, 'set', { value : function( name, value ) { return this.setAttribute( name, value ) } } );
		}
	}
	{
		// non returning next for permeable function
		extension( (function *(){}()).__proto__.__proto__, 'go', { get : () => function() { return void( this.next() ) } } );
	}
	{
		// map ( synchronous callback ) for permeable functions 
			function permeable_map( that, callback ) {
				function *mapped_to() {
					const next = () => this.next();
					for( let value of that ) {
						let result = callback( value );
						yield result;
					}
				}
				return new mapped_to();
			}

			extension( (function *(){}()).__proto__.__proto__, 'map', { get : () => function( callback ) { return permeable_map( this, callback ); } } );
	}
	{
		// map ( asynchronous call back ) for permeable functions
			// asynchronous map callback waiter
				function *waiter( callback, value ) {
					const secret = Math.random(), next = val => this.next( { code : secret, result : val } ),
						next_SHOW = val => console.log( next( val ) );
					let result;
					//callback( value, next_SHOW ); // displays 'BOOGA' before result is ready
					callback( value, next ); 
					while( true ) {
						result = yield 'pending';
						if( result && result.code && result.code == secret && result.result.complete ) {
							// Why do we have the extra yield ? 
								// this extra yield is necessary to catch the next function above,
								// the output of that next function is what is yielded here
								// the output of the subsequent next call ( from the yield* statement in the for of loop in asynchronous_map )
								// will receive the returned value, result.result, below.
								// this means the result is now ready.
								// we could fire an onberforeready or onbeforeyield or onbeforereturned or onbeforeload event here.
								// to see BOOGA change callback( value, next ) to callback( value, next_SHOW );
							yield "BOOGA";
							break;
						}
					}
					return result.result.val;
				}

			// asychronous map permeable
				function *asynchronous_map( that, callback ) {
					for( let value of that ) {
						const wt = new waiter( callback, value ),
							result = yield *wt;
						yield result;
					}
				}
					
				extension( (function *(){}()).__proto__.__proto__, 'async_map', { get : () => function( async_callback ) { return new asynchronous_map( this, async_callback ); } } );
	}
	{
		// forEach ( synchronous call back ) for permeable functions
			function *permeable_forEach( that, callback ) {
				for( let value of that ) { 
					callback( value );
					yield void( setTimeout( () => this.next(), 50 ) );
				}
			}	
			extension( (function *(){}()).__proto__.__proto__, 'forEach', { get : () => function( callback ) { return new permeable_forEach( this, callback ); } } );
	}
	{
		// forEach ( asynchronous call back ) for permeable functions
			// asynchronous map callback waiter
				function *waiter( callback, value ) {
					const secret = Math.random(), next = val => this.next( { code : secret, result : val } ),
						next_SHOW = val => console.log( next( val ) );
					let result;
					//callback( value, next_SHOW ); // displays 'BOOGA' before result is ready
					callback( value, next ); 
					while( true ) {
						result = yield 'pending';
						if( result && result.code && result.code == secret && result.result.complete ) {
							// Why do we have the extra yield ? 
								// this extra yield is necessary to catch the next function above,
								// the output of that next function is what is yielded here
								// the output of the subsequent next call ( from the yield* statement in the for of loop in asynchronous_map )
								// will receive the returned value, result.result, below.
								// this means the result is now ready.
								// we could fire an onberforeready or onbeforeyield or onbeforereturned or onbeforeload event here.
								// to see BOOGA change callback( value, next ) to callback( value, next_SHOW );
							yield "BOOGA";
							break;
						} else {
							console.log( 'checking' );
						}
					}
					return result.result.val;
				}

			// asychronous map permeable
				function *asynchronous_forEach( that, callback ) {
					for( let value of that ) {
						// the reason things are getting held up
							// is because we are waiting for a number value
							// yet we are calling waiter with a value that is not a number
							// so even when the call back returns
							// progression will be rejected and the waiter will continue 
							// therefore it works to have a way for async flows to signal whether they 
							// are pending or not and for these flows
							// to be aware of that a protocol of transmission is required
							// perhaps a pending flag 
							// clearly the values are not always going to be numbers so checking if they are numbers, as below, 
							// is not a general solution that works 
						if( !isNaN( Number( value ) ) ) {
							const game = setInterval( () => this.next(), 50 ),
								wt = new waiter( callback, value ),
								result = yield *wt;
							yield result;
							clearInterval( game );
						} else {
							const game = setTimeout( () => this.next(), 50 );
							yield;
							console.log( 'waiting' );
							clearTimeout( game );
						}
					}
				}
					
				extension( (function *(){}()).__proto__.__proto__, 'async_forEach', { get : () => function( async_callback ) { return new asynchronous_forEach( this, async_callback ); } } );
	}
	{
		// proxify ( copy all of an objects own property descriptors )
			function proxify( proxy, source, options ) {
				const properties = Object.getOwnPropertyDescriptors( source, true );
				for( let property of properties ) {
					// skip any excluded ones
					if( options && options.exclude && options.exclude.includes( property.name ) ) continue;
					// skip any unconfigurable ones
					const existing = Object.getOwnPropertyDescriptor( proxy, property.name );
					if ( existing && ! existing.configurable ) continue;
					Object.defineProperty( proxy, property.name, property.definition.with( { configurable : true } ) );
				}
			}

		extension( self, 'proxify', { value : proxify } );	
	}
	{
		// all ( multiple inheritance )
		// FIXME : copy static methods
		// FIXME : run constructors 
			// strategy 
				// we create an object
				// and then proxy that object's properties 
				// through a new object 
				// each time we create an object
				// we proxy the properties through 
				// this is a workable strategy 
				// we just create one object of each class in the constructor
				// then we create a single object that proxies all these together
				// there is then no need for a prototype splicing 
				// I do appreciate prototype splicing
				// It is elegant
				// However, it itself involves proxying
				// So we can do multiple inheritance
				// Simply by creating a new version of each object in the constructor
				// And proxying the properties 
				// The issue with this is we end up with an object
				// With all its inherited properties exposed on itself
				// It is efficient, since there is no prototype lookup
				// However it is also somewhat messy no ?
				// Also the "SUPER CLASS" constructor will work to be 
				// this [ S$ ] since super will not work  	
				// so we have 3 steps
				// splice the prototypes via prototype proxies
				// create a new instance of each requested constructor
				// and proxy the own properties of those objects ( this is the "super constructor" )
				// proxy the own properties of each constructor 
				// it sounds like it works to have a method that can copy an objects properties to another object 	
		// code 
			// splice together prototype chains to create multiple inheritance
				function get_prototype_chain( constructor ) {
					const chain = [];
					let proto = constructor.prototype;
					while( proto ) {
						chain.suck( proto );
						proto = proto.__proto__;
					}
					return chain;
				}

			// given a list of constructors 
			// merge there prototype chains in an order that doesn't spoil the separate inheritance chains 
			// FIXME define loop termination condition 
				function merge_prototype_chains( chains ) {
					const merged_prototype_sequence = [];
					let t = 0;
					for( let chain = 0; chain < chains.length; ) {
						// FIXME by defining correct loop termination
						t++;
						if( t > 100 ) break;
						let current = chains[ chain ].first;
						const other_indices = chains.map( ( c, i ) => ( { index : c.indexOf( current ), chain : i } ) ),
							heads = other_indices.filter( pos => pos.index == 0 ),
							in_any_tails = other_indices.some( pos => pos.index ),	
							not_shared = other_indices.every( pos => ( pos.chain == chain || pos.index == -1 ) );
						if( not_shared ) {	
							merged_prototype_sequence.push( chains[ chain ].drop() );
						} else if ( in_any_tails ) {
							chain++;
						} else if ( heads.length ) {
							merged_prototype_sequence.push( current );
							heads.forEach( pos => chains[ pos.chain ].drop() );
						}
						if( chains[chain].length == 0 ) {
							chain++;
						}
					}
					return merged_prototype_sequence;
				}

			// splice prototypes 
				function splice_prototype_sequence( sequence ) {
					sequence.forEach( ( proto, index, seq ) => index ? proto.__proto__ = seq[ index - 1 ]: void 0 );
					return sequence;
				}

			// helper ( create a proxy of a prototype ) 
				function proxy_prototype( proto ) { 
					function proxified_prototype() { 
						if( this.__proto__ ) { 
							proxify( this, this.__proto__ );
							const ident_symbol = Symbol( `[[Proxy]]` );
							this[ ident_symbol ] = this.__proto__;
						}
					}; 
					proxified_prototype.prototype = proto; 
					return new proxified_prototype; 
				}

			// all ( multiple inheritnace )
				function all( ...constructors ) {
					const chains = constructors.map( c => get_prototype_chain( c ) ),
						merged_sequence = merge_prototype_chains( chains ),
						proxied_sequence = merged_sequence.map( proxy_prototype ),
						spliced_sequence = splice_prototype_sequence( proxied_sequence );
					function CompositeClass( mapped_args ) {
						mapped_args = mapped_args || {};
						// why do we have mapped args ?
							// because we are using multiple inheritnace 
							// the arguments to each constructor 
							// are mapped to a slot in the mapped_args object named
							// with the name of the constructor 
						const instances = constructors.map( c => ( { type : c, args : mapped_args[ c.name ] || [] } ) )
							.map( call => call.type.of ? call.type.of( ... call.args ) : new call.type( ...call.args ) );

						// why do we have this on_derived method ? 
							// call the on_derived method of the base class ( if present )
							// to perform whatever tasks the base class has
							// where it works for that base class to have access to the derived instance
							// such as for example the derived instance's constructor property 
						instances.filter( i => Object.getOwnPropertyNames( i.constructor.prototype ).includes( 'on_derived' ) ) 
							.map( i => i.on_derived( this ) );

						// so that an instance of the composite will bear all properties of those it inherits from 
						// add each instances own properties to this 
						instances.forEach( i => proxify( this, i ) );

						// create a type signature 
						const seq_name = merged_sequence.map( p => p.constructor.name ).join( ':' ),
							multiple_name = constructors.map( p => p.name ).join( ',' );
						Object.defineProperty( this, '[[type]]', { value : `${ seq_name }:(${ multiple_name })`  } );
					};

					// so that the composite will bear all static properties of all it in the chain it inherits from 
					// add these ( excluding prototype since this is declined from being redefined )
					// instead of merging, we could actually create a new spliced version of the parallel prototype chain
					// ( the prototype chain that runs on constructor.__proto__ )
					// so instead of merging, we could simply splice a new parallel prototype chain
					// 
					merged_sequence.map( p => p.constructor ).forEach( c => proxify( CompositeClass, c, { exclude : [ 'prototype' ] } ) );
					// this would involve proxifying these as well 
					//splice_prototype_sequence( merged_sequence.map( p => p.constructor ) )

					// so that an instance will bear all properties in the chain 
					// link to the spliced composite prototype 
					CompositeClass.prototype = spliced_sequence.last;

					return CompositeClass;
				}

		extension( self, 'all', { value : all } );
	}
	{
		// Desymbolfy 
		function desymbolfy( thing ) {
			if( typeof thing !== "symbol" ) return thing;
			if( Symbol.keyFor( thing ) ) return Symbol.keyFor( thing );	
			const string = thing.toString(),
				match = string.match( /Symbol\((.*)\)$/ );
			if( match && match.length > 1 ) return match[1];	
			return '';
		}
		extension( self, 'desymbolfy', { get : () => desymbolfy } );
	}
	{
		// String toTitleCase
		function toTitleCase() {
			return this[0].toLocaleUpperCase() + this.slice(1);
		}	
		extension( String.prototype, 'toTitleCase', { get : () => toTitleCase } );
	}
// Classes 
	{
		// Typeon ( atomic unit of type )
		// a constructor function which can be extended to provide a null base prototype
		function Typeon () {}; Typeon.prototype = Object.create( null );
		
		self.Typeon = Typeon;
	}
	{
		// AbstractSuper
		const type_tag = internal_name( 'type' );
		class AbstractSuper {
			constructor() {
				this[ type_tag ] = internal_name( this.toString() );
			}
			toString() {
				return this.constructor.name;
				const name_chain = [];
				let me = this;
				while( me.__proto__ !== null ) {
					me = me.__proto__;
					name_chain.unshift( me.constructor.name );
				}	
				return name_chain.join(':');
			}
			get [ Symbol.toStringTag ]() {
				return this.toString();
			}
		}
		self.AbstractSuper = AbstractSuper;
	}
	{
		// Privates ( super class and symbols )

		// private parts

			const type_tag = internal_private_name( 'type' );

			function privatize( name ) {
				return `Privates:${ name }`;
			}

			function internal_private_name( name ) {
				return internal_name( privatize( name ) );
			}

		// exported parts 

			// this is recommended to use to private class symbols that only need to exist in the scope they are defined
			function private_symbol( name ) {
				return Symbol( internal_private_name( name ) );
			}

			// this is recommended to use for private class symbols that may need to exist across different scopes	
			// such as when the class is paritally defined across multiple files and more than one part
			// works to refer to the class's privates
			// recoverable private symbols can be accessed outside the scope it is defined
			// we add a '#' to the start of the name so you can see it is recoverable
			// this hash name is returned by the Symbol.keyFor method when called on the symbol
			// this method returns 
			function recoverable_private_symbol( name ) {
				return Symbol.for( '#' + internal_private_name( name ) );
			}

			// Privates Super Class
			class Privates {
				constructor( key, publics ) {
					this[ type_tag ] = internal_private_name( publics ? publics.constructor.name : '' );
					this.key = key;
					this.bind_publics( publics );
				}
				bind_publics( publics ) {
					this.publics = publics;
					if( this.publics ) Object.defineProperty( this.publics, this.key, { get : () => this } );
				}
				get [ Symbol.toStringTag ]() {
					return this[ type_tag ];
				}
			}

		self.Privates = Privates;
		self.private_symbol = private_symbol;
		self.recoverable_private_symbol = recoverable_private_symbol;
	} 
	{
		// IterablePrivates 
		// a super class of an implementation of an iterable
		// contains methods defaulting to when the internal representation is an array
		// for descendents that use internal representations that are not arrays
		// it works to override those methods whose behaviour changes when this.values is not an array
		class IterablePrivates extends Privates {
			constructor( key ) {
				super( key );
				// default is an array
				this.internal = [];
			}
			iterator() {
				return this.internal[ Symbol.iterator ]();
			}
			get [ Symbol.iterator ]() {
				return () => this.iterator();
			}
			get values() {
				return () => this.iterator();
			}
			get length() {
				return this.internal.length;
			}
			get keys() {
				return () => this.internal.keys();
			}
			get entries() {
				return () => this.internal.entries();
			}
			get forEach() {
				return ( callback, thisArg ) => this.internal.forEach( callback, thisArg );
			}
			get map() {
				return ( callback, thisArg ) => this.internal.map( callback, thisArg );
			}
			get filter() {
				return ( callback, thisArg ) => this.internal.filter( callback, thisArg );
			}
			get some() {
				return ( callback, thisArg ) => this.internal.some( callback, thisArg );
			}
			get every() {
				return ( callback, thisArg ) => this.internal.every( callback, thisArg );
			}
			get reduce() {
				return ( callback, firstValue ) => this.internal.reduce( callback, firstValue ); 
			}
			get reduceRight() {
				return ( callback, firstValue ) => this.internal.reduceRight( callback, firstValue ); 
			}
			get has() {
				return item  => this.internal.has( item ); 
			}
			get indexOf() {
				return item => this.internal.indexOf( item );
			}
			get lastIndexOf() {
				return item => this.internal.lastIndexOf( item );
			}
			get nth() {
				return n => this.internal[ n ];
			}
			get nthLast() {
				return nth_from_end => this.internal[ this.internal.length - nth_from_end ];
			}
		}	
		self.IterablePrivates = IterablePrivates;
	}
	{
		// AbstractIterable ( and its privates ) which expect a key to an iterable privates
		const $ = private_symbol( 'IterablePrivates' );

		// the interface of an iterable 
		// depends on being passed in a implementation, iterable_privates
		class AbstractIterable extends AbstractSuper {
			constructor( iterable_privates ) {
				super();
				// create a reference for descendent classes based on the key property of iterable_privates
				iterable_privates.bind_publics( this );
				// create a reference for us using our private property, $ 
				Object.defineProperty( this, $, { get : () => iterable_privates } );
			}
			get [ Symbol.toStringTag ]() {
				return `${ this.constructor.name } length ${ this.length }`;
			}
			get [ Symbol.iterator ]() {
				return this[ $ ][ Symbol.iterator ];
			}
			get length() {
				return this[ $ ].length;
			}
			get values() {
				return this[ $ ].values;
			}
			get keys() {
				return this[ $ ].keys;
			}
			get entries() {
				return this[ $ ].entries;
			}
			get map() {
				return this[ $ ].map;
			}
			get filter() {
				return this[ $ ].filter;
			}
			get forEach() {
				return this[ $ ].forEach;
			}
			get some() {
				return this[ $ ].some;
			}
			get every() {
				return this[ $ ].every;
			}
			get reduce() {
				return this[ $ ].reduce;
			}
			get reduceRight() {
				return this[ $ ].reduceRight;
			}
			get has() {
				return this[ $ ].has;
			}
			get indexOf() {
				return this[ $ ].indexOf;
			}
			get lastIndexOf() {
				return this[ $ ].lastIndexOf;
			}
			get nth() {
				return this[ $ ].nth;
			}
			get nthLast() {
				return this[ $ ].nthLast;
			}
			static from( ...args ) {
				return new this( ...args );
			}
		}	

		self.AbstractIterable = AbstractIterable;
	}
	{
		// Queue
		const $ = private_symbol( 'Queue' );

		class QueuePrivates extends IterablePrivates {
			constructor( key, bound ) {
				super( key );
				this.bound = bound;
			}
		}

		class Queue extends AbstractIterable { 
			constructor( bound ) {
				bound = Number.isSafeInteger( bound ) ? bound : null;
				super( new QueuePrivates( $, bound ) );
			}
			static of( ...items ) {
				const q = new this( items.length );
				q.join( ...items );
				return q;
			}
			static from( iterable ) {
				let q;
				if( Array.isArray( iterable ) ) q = new this( iterable.length );
				else q = new this();	
				q.join( ...iterable );
				return q;
			}
			get bound() {
				return this[ $ ].bound;	
			}	
			set bound( max_length ) {
				this[ $ ].bound = max_length;
				if( this[ $ ].bound ) while( this[ $ ].bound < this.length ) this.next();
			}
			get first() {
				return this[ $ ].internal.first;
			}
			get last() {
				return this[ $ ].internal.last;
			}
			join( ...items ) {
				// only accept up to bound of the items
				const bound = this.bound || items.length,
					started_with = this.length;
				for( let item of items ) {
					if( this.length >= bound ) break;
					this[ $ ].internal.push( item );
				}
				return this.length - started_with;
			}
			flush( ...items ) {
				// accept any number of items and push off the front of the queue to do so
				for( let item of items ) {
					this[ $ ].internal.push( item );
					if( this.bound ) while( this.bound < this.length ) this.next();
				}
				return items.length;
			}
			next( ) {
				return this[ $ ].internal.shift();
			}
			get [ Symbol.toStringTag ]() {
				return super[ Symbol.toStringTag ]; 
			}
		}

		self.Queue = Queue;
	}
	{
		// Stack
		const $ = private_symbol( 'Stack' );	

		class StackPrivates extends IterablePrivates {
			constructor( key ) {
				super( key );	
			}
		}

		class Stack extends AbstractIterable {
			constructor( ...items ) {
				super( new StackPrivates( $ ) );
				this.push( ...items );
			}
			push( ...items ) {
				return this[ $ ].internal.push( ...items );
			}
			pop() {
				return this[ $ ].internal.pop();
			}
			get top() {
				return this[ $ ].internal.last;
			}	
			get bottom() {
				return this[ $ ].internal.first;
			}
		}

		self.Stack = Stack;
	}
	{
		// Enum
		const $ = private_symbol( 'Enum' );

		class Case { 
			constructor( name ) { 
				Object.defineProperty( this, $, { get : () => name } );
				this[ internal_name( 'type' ) ] = internal_name( name ); 
			}
			get [ Symbol.toStringTag ]() {
				return `Case:${ this[ $ ] }`;
			}
		}

		class EnumPrivates extends IterablePrivates {
			constructor( key ) {
				super( key );
				this.internal = new Map();
				this.case_values = new Set();
			}
			new_case( name ) {
				return new Case( name );
			}
			iterator() {
				return this.internal.values();
			}
			get length() {
				return this.internal.size();
			}		
			get map() {
				return ( callback, thisArg ) => [ ...this ].map( callback, thisArg );
			}
			get some() {
				return ( callback, thisArg ) => [ ...this ].some( callback, thisArg );
			}
			get every() {
				return ( callback, thisArg ) => [ ...this ].every( callback, thisArg );
			}
			get reduce() {
				return ( callback, firstValue ) => [ ...this ].reduce( callback, firstValue ); 
			}
			get reduceRight() {
				return ( callback, firstValue ) => [ ...this ].reduceRight( callback, firstValue ); 
			}
		}

		class Enum extends AbstractIterable {
			constructor( type_name, name_string ) {
				super( new EnumPrivates( $ ) );
				Object.defineProperty( this, 'name', { get : () => type_name } );
				const names = [ ... new Set( name_string.split( /\s+/g ).filter( name => name.length ) ) ];
				for( let name of names ) {
					const type = this[ $ ].new_case( name );
					Object.defineProperty( this, name, { value : type, enumerated: true } );
					this[ $ ].internal.set( name, type );
					this[ $ ].case_values.add( type );
				}
				Object.freeze( this );
			}
			get [ Symbol.toStringTag ]() {
				return `Enum(${ [ ...this[ $ ].values ] })`; 
			}
			valid( case_instance ) {
				// check if case is a valid member of the enum sum type 
				return this[ $ ].case_values.has( case_instance );
			}
			validate( case_instance ) {
				// check if case is a valid member of the enum sum type 
				if( this.valid( case_instance ) ) return case_instance;
				return new ThrownTypeError( `${ this.name } : ${ case_instance }` );
			}
		}

		self.Enum = Enum;
	}
	{
		// range
		// once permeable functions have array methods make this a permeable 
		// or make a permeable version

		function range( start, end_before, step ) {
			step = step || 1;
			function *source() {
				for( let i = start; i < end_before; i += step ) yield i; 
			}
			return [ ...new source() ];
		}

		self.range = range;
	}
	{
		// bounded ( check if a number is within the range )

		const bounded = ( low, n, high ) => low <= n && n <= high;
		extension( self, 'bounded', { get : () => bounded } );
	}
// Utility functions 
	{
		// check if a function is a permeable function
		const permeable_prototype = (function *() {}).prototype.__proto__;
		class PermeableFunction {
			static isPermeableFunction( value ) {
				return value.__proto__ && value.__proto__.__proto__ == permeable_prototype;
			}
		}
		self.PermeableFunction = PermeableFunction;
	}
	{
		// flatten an iterable ( array or permeable or other iterable ) ( using a permeable )
		function *flatten( iterable ) {
			for( let value of iterable ) {
				if( Array.isArray( value ) || PermeableFunction.isPermeableFunction( value ) ) {
					yield *flatten( value );
				} else {
					yield value;
				}
			}	
		}
		extension( self, 'flatten', { get : () => flatten } );
	}
	{
		// not conditional
		function not( test ) {
			return !test;
		}		
		extension( self, 'not', { value : not } );
	}
	{
		// by property filter 
		function by( name, value ) {
			return thing => value ? thing[ name ] === value : !!thing[ name ];
		}
		extension( self, 'by', { value : by } );
	}
	{
		// check a number is in a range 
		class	IN {
			static in( ...items ) {
				switch( items.length ) {
					case 2:
						return this >= items[0] && this <= items[1];
					default:
						return items.has( this );
				}
			}
		}	
		extension( Number.prototype, 'in', { value : IN.in } );
	}
	{
		// trying to add intelligent naming to string representations of objects
		function name() {
			return this.__proto__ ? this.__proto__.constructor.name : 'unknown';
		}
		function function_name() {
			return this.name ? `Function${his.name}` : 'FunctionAnonymous';
		}
		extension( Object.prototype, Symbol.toStringTag, { get : name } );
		extension( Function.prototype, Symbol.toStringTag, { get : function_name } );
	}
	{
		// iterated application, more are coming
		// this is dangerous as if you call iterate over a function it just keeps going !
		function *iterated_application( ...args ) {
			let val = yield this( ...args );
			while( true ) {
				yield val = this( val );
			}
		}	
		
		//extension( Function.prototype, Symbol.iterator, { get : () => iterated_application } );
	}
