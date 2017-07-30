'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Classes
var Component = function Component(config) {

    if (!config.templateURL || !config.route) throw 'Your component requires atleast a [templateURL] and [route]';

    this.templateURL = config.templateURL;
    this.selector = config.selector;
    this.route = new Route(config.route);
    this.data = new Data(config.data) || {};
    this.hook = config.hook || null;
    this.controller = config.controller || null;
    this._rawTemplate = null;

    this.updateView = function () {
        var _this = this;

        return parseTemplate(this, this._rawTemplate.outerHTML).then(function (updatedTemplate) {
            // Clear the previous template
            _this.selector.innerHTML = null;

            // Insert updated template in selector element
            _this.selector.insertBefore(updatedTemplate, _this.selector.firstElementChild);
        }, function (err) {
            console.log('Error updating view', err);
        });
    };
};

var App = function App(appName) {

    var self = this;

    var rootElement = document.querySelector('[data-app="' + appName + '"]');
    if (!rootElement) throw 'Could not find root element ' + appName;

    this.components = [];
    this.title = appName;
    this.router = new Router();

    this.init = function () {
        // Current URL the user navigated to
        var route = window.location.hash ? window.location.href : this.router.rootPage;

        // Give router access to available components
        this.router.set(this.components);

        // Initiate routing based on start URL
        this.router.getComponentByRoute(route);
    };

    this.component = function (_) {

        // If no selector was defined for the component, use the rootElement
        _.selector = !_.selector ? rootElement : document.querySelector(_.selector);

        self.components.push(new Component(_));
    };
};

var Route = function Route(URI) {

    this.URI = null;
    this.parameter = null;

    var regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;

    URI = URI.slice(-1) == '/' ? URI : URI + '/';

    if (!regex.test(URI)) throw URI + ' is not a valid URL';

    if (regex.exec(URI)[3]) {
        var parameter = regex.exec(URI)[3];
        parameter = parameter.substring(1, parameter.length - 1);

        this.parameter = parameter;
    }

    this.URI = regex.exec(URI)[1];

    if (regex.exec(URI)[2]) this.URI += regex.exec(URI)[2];
};

var Router = function Router() {

    var self = this;

    this.rootPage = '#';
    this.components = null; // array
    this.currentRoute = null;
    this.history = [];

    this.set = function (_) {
        self.components = _;
    };

    this.getDataFromURI = function (URL, route) {

        var regex = /\/(?!\/)(\w*)\/(?!\w*.)/;
        URL = URL.slice(-1) == '/' ? URL : URL + '/';

        var data = {};

        if (!regex.test(URL)) throw URL + ' is not a valid URL';

        if (regex.exec(URL)[1] && route.parameter) data = _defineProperty({}, route.parameter, regex.exec(URL)[1]);

        return data;
    };

    this.getURIFromString = function (URL) {

        var regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;
        URL = URL.slice(-1) == '/' ? URL : URL + '/';

        if (!regex.test(URL)) throw URL + ' is not a valid URL';

        return regex.exec(URL)[1];
    };

    this.render = function (component, params) {
        return new Promise(function (resolve, reject) {

            // Component
            var _ = component;

            var hook = _.hook && _typeof(_.hook()) == 'object' ? _.hook() : {};

            // Initiate actions before loading the view; may be overridden with hooks
            if (hook.viewBeforeLoad) hook.viewBeforeLoad(_, params);

            loadTemplate(_).then(function (template) {

                // Insert template in app selector element
                _.selector.insertBefore(template, _.selector.firstElementChild);

                // Initiate actions after loading the view; may be overridden with hooks
                if (hook.viewDidLoad) hook.viewDidLoad(_, params);

                // Run controller function
                if (_.controller) _.controller(_, params);

                resolve('Navigated to ' + _.route.URI + ' with ' + JSON.stringify(params));
            }, function (err) {
                return reject('Error loading template: ' + err);
            });
        });
    };

    this.getComponentByRoute = function (URL) {

        var URI = self.getURIFromString(URL);
        var data = {};

        for (var i = 0; i < self.components.length; i++) {

            var routeURI = self.components[i].route.URI;

            if (routeURI == URI) {

                var route = self.components[i].route;

                // Add the current hash including any parameters to the history
                var historyRoute = window.location.hash;

                if (route.parameter) data = self.getDataFromURI(URL, route);

                self.currentRoute = route;

                // Add the current route to the history, but only if it wasn't the lastly navigated page
                if (self.history[self.history.length - 1] !== historyRoute) self.history.push(historyRoute);

                self.render(self.components[i], data).then(function (result) {
                    return console.log(result);
                }, function (err) {
                    return console.log(err);
                });
            }
        }
    };

    this.back = function () {

        var previousComponent = self.history[self.history.length - 2];

        if (previousComponent) {
            self.history.pop();
            window.location.href = previousComponent;
            console.log(window.location);
        }
    };

    // On changing the hash navigate to different view
    window.onhashchange = function (e) {
        self.getComponentByRoute(e.newURL);
    };
};

var Data = function Data(data) {

    this.data = data;
};

// Methods
var loadTemplate = function loadTemplate(component) {

    return new Promise(function (resolve, reject) {

        var http = new XMLHttpRequest();

        http.onload = function () {
            if (this.status >= 200 && this.status < 300) {

                // Clear target element before injecting new template
                component.selector.innerHTML = null;

                // Parse the template (for bracket notations) before resolving,
                // and provide data declared in the component to render the proper content
                parseTemplate(component, this.responseText).then(function (template) {
                    return resolve(template);
                }, function (err) {
                    throw err;
                });
            } else {
                reject(this.response);
            }
        };

        http.onerror = function () {
            reject(this.response);
        };

        http.open('GET', component.templateURL);
        http.send();
    });
};

// TODO: Consider partial parsing of template, to support rendering seperate elements as opposed to the whole template
// TODO: This will require using attributes to target the right elements
var parseTemplate = function parseTemplate(_, _template) {

    return new Promise(function (resolve, reject) {
        var regex = /{{ ?([a-zA-Z0-9_.$@]*) ?}}/g;

        var parse = new DOMParser();
        var templateDocument = parse.parseFromString(_template, 'text/html').documentElement;
        var template = templateDocument.getElementsByTagName('body')[0].firstElementChild;

        // Assign the raw template to the component to allow for view updates
        _._rawTemplate = template;

        // Return if the template does not have any content
        if (!template) reject('Template is not of type HTML or does not contain any elements');

        // If there is nothing to parse, return the unparsed template
        if (!regex.test(_template)) resolve(template);

        var data = _.data.data;
        var matches = [];
        var match = void 0;

        var nrOfMatches = _template.match(regex).length;

        for (var i = 0; match = regex.exec(_template); i++) {
            matches.push(match);

            if (nrOfMatches == matches.length) {

                for (var j = 0; j < matches.length; j++) {

                    // Evaluate the strings to access the data object properties
                    var valueWithBrackets = matches[j][0];
                    var value = eval('data.' + matches[j][1]) || eval('data["' + matches[j][1] + '"]');

                    _template = _template.replace(valueWithBrackets, value);
                }

                var parsedTemplateDocument = parse.parseFromString(_template, 'text/html').documentElement;
                var parsedTemplate = parsedTemplateDocument.getElementsByTagName('body')[0].firstElementChild;

                resolve(parsedTemplate);
            }
        }

        return template;
    });
};
