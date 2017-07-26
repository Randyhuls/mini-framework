'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Classes
var App = function App(appName) {

    var rootElement = document.querySelector('[data-app="' + appName + '"]');
    if (!rootElement) throw 'Could not find root element ' + appName;

    var router = new Router();

    this.template = function (_) {

        if (!_.route) throw 'No route was defined for this template';

        router.set(_, rootElement);
    };
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

    this.routes = [];
    this.currentRoute = null;
    this.history = [];

    this.set = function (_, rootElement) {

        var route = new Route();
        route.set(_, rootElement);

        self.routes.push(route);

        // On changing the hash navigate
        window.onhashchange = function (e) {

            var URI = self.getURIFromString(e.newURL);
            var data = {};

            for (var i = 0; i < self.routes.length; i++) {

                if (self.routes[i].URI == URI) {

                    var _route = self.routes[i];

                    if (_route.parameter) data = self.getDataFromURI(e.newURL, _route);

                    self.currentRoute = _route;
                    self.history.push(_route);

                    self.go(URI, data).then(function (result) {
                        return console.log(result);
                    }, function (err) {
                        console.log(err);
                    });
                }
            }
        };
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

    this.go = function (URI, data) {
        return new Promise(function (resolve, reject) {

            var _ = self.currentRoute.component;

            loadTemplate(_.rootElement, _.templateURL).then(function (template) {
                var hook = _.hook && _typeof(_.hook()) == 'object' ? _.hook() : {};

                // Initiate actions before loading the view; may be overridden with hooks
                if (hook.viewBeforeLoad) hook.viewBeforeLoad();

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

    this.back = function () {

        var previousRoute = self.routes[self.routes.length - 1];

        if (previousRoute) {
            self.routes.pop();
            window.history.back();
        }
    };
};

// Methods
var loadTemplate = function loadTemplate(rootElement, path) {

    return new Promise(function (resolve, reject) {

        var http = new XMLHttpRequest();

        http.onload = function () {
            if (this.status >= 200 && this.status < 300) {

                var parse = new DOMParser();
                var templateDocument = parse.parseFromString(this.responseText, 'text/html').documentElement;
                var template = templateDocument.getElementsByTagName('body')[0].firstElementChild;

                if (!template) return;

                // Clear target element before injecting new template
                rootElement.innerHTML = null;

                resolve(template);
            } else {
                reject(this.response);
            }
        };

        http.onerror = function () {
            reject(this.response);
        };

        http.open('GET', path);
        http.send();
    });
};
