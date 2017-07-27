'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Classes
var App = function App(appName) {

    var rootElement = document.querySelector('[data-app="' + appName + '"]');
    if (!rootElement) throw 'Could not find root element ' + appName;

    var templates = [];

    this.title = appName;

    this.router = new Router();

    this.init = function () {

        var route = window.location.hash ? window.location.href : this.router.rootPage;

        for (var i = 0; i < templates.length; i++) {
            this.router.set(templates[i], rootElement);
        }

        // Initiate routing based on start URL
        this.router.go(route);
    };

    this.template = function (_) {
        if (!_.route) throw 'No route was defined for this template';
        templates.push(_);
    };

    this.setRootPage = function (URI) {};
};

var Route = function Route() {

    this.URI = null;
    this.parameter = null;
    this.component = null;

    this.set = function (_, rootElement) {

        var regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;

        _.route = _.route.slice(-1) == '/' ? _.route : _.route + '/';

        if (!regex.test(_.route)) throw _.route + ' is not a valid URL';

        if (regex.exec(_.route)[3]) {
            var parameter = regex.exec(_.route)[3];
            parameter = parameter.substring(1, parameter.length - 1);

            this.parameter = parameter;
        }

        this.URI = regex.exec(_.route)[1];

        if (regex.exec(_.route)[2]) this.URI += regex.exec(_.route)[2];

        this.component = _;
        this.component['rootElement'] = rootElement;
    };
};

var Router = function Router() {

    var self = this;

    this.rootPage = '#';
    this.routes = [];
    this.currentRoute = null;
    this.history = [];

    this.set = function (_, rootElement) {

        var route = new Route();
        route.set(_, rootElement);

        self.routes.push(route);
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

    this.route = function (URI, data) {
        return new Promise(function (resolve, reject) {

            var _ = self.currentRoute.component;

            loadTemplate(_).then(function (template) {
                var hook = _.hook && _typeof(_.hook()) == 'object' ? _.hook() : {};

                // Initiate actions before loading the view; may be overridden with hooks
                if (hook.viewBeforeLoad) hook.viewBeforeLoad();
                console.log(template);
                // Insert template in app route element
                _.rootElement.insertBefore(template, _.rootElement.firstElementChild);

                // Initiate actions after loading the view; may be overridden with hooks
                if (hook.viewDidLoad) hook.viewDidLoad();

                // Run component function
                if (_.component) _.component(_, data);

                resolve('Navigated to ' + URI + ' with ' + JSON.stringify(data));
            }, function (err) {
                return reject('Error loading template:' + err);
            });
        });
    };

    this.go = function (URL) {
        console.log('route!');

        var URI = self.getURIFromString(URL);
        var data = {};

        for (var i = 0; i < self.routes.length; i++) {

            if (self.routes[i].URI == URI) {

                var route = self.routes[i];

                if (route.parameter) data = self.getDataFromURI(URL, route);

                self.currentRoute = route;
                self.history.push(route);

                self.route(URI, data).then(function (result) {
                    return console.log(result);
                }, function (err) {
                    console.log(err);
                });
            }
        }
    };

    this.back = function () {

        var previousRoute = self.routes[self.routes.length - 1];

        if (previousRoute) {
            self.routes.pop();
            window.location.href = previousRoute.URI;
        }
    };

    // On changing the hash navigate to different view
    window.onhashchange = function (e) {
        self.go(e.newURL);
    };
};

// Methods
var loadTemplate = function loadTemplate(_) {

    return new Promise(function (resolve, reject) {

        var http = new XMLHttpRequest();

        http.onload = function () {
            if (this.status >= 200 && this.status < 300) {

                // TODO: Maybe parsing only has to happen in parseTemplate function???
                var parse = new DOMParser();
                var templateDocument = parse.parseFromString(this.responseText, 'text/html').documentElement;
                var template = templateDocument.getElementsByTagName('body')[0].firstElementChild;

                if (!template) return;

                // Clear target element before injecting new template
                _.rootElement.innerHTML = null;

                // Parse the template for bracket notations before resolving
                parseTemplate(_.data, template).then(function (template) {
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

        http.open('GET', _.templateURL);
        http.send();
    });
};

var parseTemplate = function parseTemplate(data, template) {

    return new Promise(function (resolve, reject) {
        var regex = /{{ ?([a-zA-Z0-9_.$@]*) ?}}/g;
        var _template = template.outerHTML;

        // If there is nothing to parse, return the unparsed template
        if (!regex.test(_template)) resolve(template);

        var matches = [];
        var match = void 0;

        console.log(data);

        var nrOfMatches = _template.match(regex).length;

        for (var i = 0; match = regex.exec(_template); i++) {
            matches.push(match);

            if (nrOfMatches == matches.length) {

                for (var j = 0; j < matches.length; j++) {

                    // Evaluate the strings to access the data object properties
                    var valueWithBrackets = matches[j][0];
                    var value = eval('data.' + matches[j][1]);

                    _template = _template.replace(valueWithBrackets, value);
                }

                var parse = new DOMParser();
                var parsedTemplateDocument = parse.parseFromString(_template, 'text/html').documentElement;
                var parsedTemplate = parsedTemplateDocument.getElementsByTagName('body')[0].firstElementChild;

                resolve(parsedTemplate);
            }
        }

        return template;
    });
};
