# mini-framework
Mini JavaScript frameworking allowing client-side routing and template rendering

## [ WIP ]

### Table of contents
1. Introduction
2. Components
3. Controllers
4. Routing
5. Template rendering
6. Hooks

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

## Components

Components are the building blocks that combine templates and logic.
By calling the `component` method on the `App` object a new `Component` object can be instantiated.

### App.component(configuration: object)
The `configuration` object takes atleast a `templateURL` and `route` property.
```javascript
myApp.component({
  templateURL: 'url/to/your/template.html',
  route: '#myPage/'
})
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
})
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
```

#### Hook

### Component
a `Component` object is instantiated after calling the app's `component` method.

#### Methods

##### updateView()

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
```
