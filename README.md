# mini-framework
Mini JavaScript framework allowing client-side routing and template rendering

***
### [ WIP ] - This documentation is still a work in progress
***

### Table of contents
1. [Introduction](#introduction)
2. [Components](#components)
⋅⋅⋅App.component(configuration: object)
⋅⋅⋅Component
3. [Routing](#routing)
4. [Templates](#templates)

## Introduction

A mini-framework app is initiated by creating a new `App` object and running it's `init` method.

### App(myAppName: string)
```javascript
let myApp = new App('MyApp');
```

A matching selector will then be sought based on the `data-app` attribute. This will be the root element where the app will be injected.
```html
<main data-app="MyApp">
  <!-- Here my app will be injected -->
</main>
```

```javascript
let myApp = new App('MyApp');

// My components

myApp.init();
```

## Components

Components are the building blocks that combine templates and logic.
By calling the `component` method on the `App` object a new `Component` object can be instantiated by passing it a configuration object.

### App.component(configuration: object)
The `configuration` object takes atleast a `templateURL` and `route` property.
```javascript
myApp.component({
  templateURL: 'url/to/your/template.html',
  route: '#myPage/'
});
```

#### Controller
The `controller` property takes a function with the parameters `component` and `params`. 

```javascript
let myPage = myApp.component({
  templateURL: 'url/to/your/template.html',
  route: '#myPage/',
  controller: function(component, params) {
  
    doSomething = function(what) {
      console.log('This will do something' + what);
    }
    
    doSomething('cool');
  }  
});
```
##### Parameters
`component`: Will give you access to all properties that are part of the `component`. 

`params`: Will give you any data passed through the current route.

#### Data

The `data` property is where you define all data available to your templates.

```javascript
let myPage = myApp.component({
  templateURL: 'url/to/your/template.html',
  route: '#myPage/',
  data: {
    myTitle: 'My Awesome app title',
    mysubTitle: 'Made with mini',
    myThing: someFunctionReturningData()
  },
  controller: function(component, params) {
    ...
  }
}):
```

#### Hook

Hooks provides means to  initiate function right before or right after the view is loaded - but always before any functions running inside the `controller`. It is required that you return the methods by returning this;

#### viewBeforeLoad
Loads before the template is injected into the DOM


#### viewDidLoad
Loads after the template is injected into the DOM

```javascript

let myPage = myApp.component({
    templateURL: 'url/to/your/template.html',
    route: '#myPage/',
    data: {
      ...
    },
    hooks: function() {
      this.viewBeforeLoad = function() {
        console.log('Do something before the view has loaded');
      },
      
      this.viewDidLoad = function() {
        console.log('Do something right after the view has loaded');
      }
      
      return this;
    }
    controller: function(component, params) {
      ...
    }
 });
```

##### Parameters
`component`: Will give you access to all properties that are part of the `component`. 

`params`: Will give you any data passed through the current route.

### Component
a `Component` object is instantiated after calling the app's `component` method.

#### Methods

##### Component.updateView()

```javascript
  let myPage = myApp.component({
    templateURL: 'url/to/your/template.html',
    route: '#myPage/',
    data: {
      myTitle: 'My first title'
    },
    controller: function(component, params) {
      // Access component's data
      this.data.data.myTitle = 'My second title'; // or component.data.data.myTitle = 'My second title';

      // Update the view
      this.updateView();
    }
  });
```
## Routing
All routing is handled by the components. You can access the router and routes through a `Component` instance.

### App.router
The router is instantiated when creating an `App`. A `Router` object has the following properties and methods:

```javascript
let myApp = new App('MyApp');
let router = myApp.router;
```

#### Properties
##### rootPage (string)
The URI hash of the page you wish to be accessed upon launch

##### components (array:[Component])
Returns an array of all components

##### history (array:[string])
Returns an array of all previously accessed route in chronological order

#### Methods
##### Router.set(array:[Component])
Used to set up your components; this is done automatically when instantiating an `App`. Can be overridden using this method if needed.

##### Router.getDataFromURI(URL: string, route:Route)
Takes an URL and a route to compare against for valid data. Returns any data found in the href.

##### Router.getURIFromString(URL: string)
Takes an URL and returns a proper hash.

##### Router.back()
Navigate to the previous page

## Templates
Templates use double curly bracket notation to reference properties defined in a `Component`'s `data` object. Double curly brackets may be used with or without single spaces.

```html
<div>
  <h1>The title of my app is {{ title }}</h1>
  <h2>And the subtitle of my app is {{subTitle}}</h2>
</div>
```

```javascript
  let myPage = myApp.component({
    templateURL: 'url/to/your/template.html',
    route: '#myPage/',
    data: {
      title: 'My cool app',
      subTitle: 'The best there ever was'
    },
    controller: function(component, params) {
      ...
    }
  });
```
