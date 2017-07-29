// Classes
let Component = function(config) {

    if (!config.templateURL || !config.route) throw 'Your component requires atleast a [templateURL] and [route]';

    this.templateURL = config.templateURL;
    this.selector = config.selector;
    this.route = new Route(config.route);
    this.data = new Data(config.data) || {};
    this.hook = config.hook || null;
    this.controller = config.controller || null;
    this._rawTemplate = null;

    this.updateView = function(data) {
        return parseTemplate(this, this._rawTemplate.outerHTML).then(
            (updatedTemplate) => {
                // Clear the previous template
                this.selector.innerHTML = null;

                // Insert updated template in selector element
                this.selector.insertBefore(updatedTemplate, this.selector.firstElementChild);
            },
            (err) => { console.log('Error updating view', err) }
        );
    }

};

let App = function(appName) {

    let self = this;

    let rootElement = document.querySelector('[data-app="'+appName+'"]');
    if (!rootElement) throw 'Could not find root element '+appName;

    this.components = [];
    this.title = appName;
    this.router = new Router();

    this.init = function() {
        // Current URL the user navigated to
        let route = window.location.hash ? window.location.href : this.router.rootPage;

        // Give router access to available components
        this.router.set(this.components);

        // Initiate routing based on start URL
        this.router.getComponentByRoute(route);
    };

    this.component = function(_) {

        // If no selector was defined for the component, use the rootElement
        if (!_.selector) _.selector = rootElement;

        self.components.push(new Component(_));
    };

};

let Route = function(URI) {

    this.URI = null;
    this.parameter = null;

    let regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;

    URI = URI.slice(-1) == '/' ? URI : URI+'/';

    if (!regex.test(URI)) throw URI + ' is not a valid URL';

    if (regex.exec(URI)[3]) {
        let parameter = regex.exec(URI)[3];
        parameter = parameter.substring(1, parameter.length-1);

        this.parameter = parameter;
    }

    this.URI = regex.exec(URI)[1];

    if (regex.exec(URI)[2]) this.URI+= regex.exec(URI)[2];

};

let Router = function() {

    var self = this;

    this.rootPage = '#';
    this.components = null; // array
    this.currentRoute = null;
    this.history = [];

    this.set = function(_) {
        self.components = _;
    };

    this.getDataFromURI = function(URL, route) {

        let regex = /\/(?!\/)(\w*)\/(?!\w*.)/;
        URL = URL.slice(-1) == '/' ? URL : URL+'/';

        let data = {};

        if (!regex.test(URL)) throw URL + ' is not a valid URL';

        if (regex.exec(URL)[1] && route.parameter) data = { [route.parameter]: regex.exec(URL)[1]};

        return data;
    };

    this.getURIFromString = function(URL) {

        let regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;
        URL = URL.slice(-1) == '/' ? URL : URL+'/';

        if (!regex.test(URL)) throw URL + ' is not a valid URL';

        return regex.exec(URL)[1];

    };

    this.render = function(component, params) {
        return new Promise((resolve, reject) => {

            // Component
            let _ = component;

            loadTemplate(_).then(
                (template) => {
                    let hook = _.hook && typeof(_.hook()) == 'object' ? _.hook() : {};

                    // Initiate actions before loading the view; may be overridden with hooks
                    if (hook.viewBeforeLoad) hook.viewBeforeLoad();

                    // Insert template in app selector element
                    _.selector.insertBefore(template, _.selector.firstElementChild);

                    // Initiate actions after loading the view; may be overridden with hooks
                    if (hook.viewDidLoad) hook.viewDidLoad();

                    // Run controller function
                    if (_.controller) _.controller(_, params);

                    resolve('Navigated to ' + _.route.URI + ' with ' + JSON.stringify(params));
                },
                (err) => reject('Error loading template: '+err)
            );

        })
    };

    this.getComponentByRoute = function(URL) {

        let URI = self.getURIFromString(URL);
        let data = {};

        for (let i = 0; i < self.components.length; i++) {

            let routeURI = self.components[i].route.URI;

            if (routeURI == URI) {

                let route = self.components[i].route;

                if (route.parameter) data = self.getDataFromURI(URL, route);

                self.currentRoute = route;
                self.history.push(route);

                self.render(self.components[i], data).then(
                    (result) => console.log(result),
                    (err) => { console.log(err) }
                );

            }

        }
    };

    this.back = function() {

        let previousRoute = self.routes[self.routes.length-1];

        if (previousRoute) {
            self.routes.pop();
            window.location.href = previousRoute.URI;
        }
    };

    // On changing the hash navigate to different view
    window.onhashchange = function(e) { self.getComponentByRoute(e.newURL); };

};

let Data = function(data) {

    this.data = data;

};

// Methods
let loadTemplate = function(component) {

    return new Promise((resolve, reject) => {

        let http = new XMLHttpRequest();

        http.onload = function() {
            if (this.status >= 200 && this.status < 300) {

                // Clear target element before injecting new template
                component.selector.innerHTML = null;

                // Parse the template (for bracket notations) before resolving,
                // and provide data declared in the component to render the proper content
                parseTemplate(component, this.responseText).then(
                    (template) => resolve(template),
                    (err) => { throw err; }
                );

            } else {
                reject(this.response);
            }

        };

        http.onerror = function() { reject(this.response) };

        http.open('GET', component.templateURL);
        http.send();

    });

};


// TODO: Consider partial parsing of template, to support rendering seperate elements as opposed to the whole template
// TODO: This will require using attributes to target the right elements
let parseTemplate = function(_, _template) {

    return new Promise((resolve, reject) => {
        let regex = /{{ ?([a-zA-Z0-9_.$@]*) ?}}/g;

        let parse = new DOMParser();
        let templateDocument = parse.parseFromString(_template, 'text/html').documentElement;
        let template = templateDocument.getElementsByTagName('body')[0].firstElementChild;

        // Assign the raw template to the component to allow for view updates
        _._rawTemplate = template;

        // Return if the template does not have any content
        if (!template) reject('Template is not of type HTML or does not contain any elements');

        // If there is nothing to parse, return the unparsed template
        if (!regex.test(_template)) resolve(template);

        let data = _.data.data;
        let matches = [];
        let match;

        let nrOfMatches = _template.match(regex).length;

        for (let i = 0; match = regex.exec(_template); i++) {
            matches.push(match);

            if (nrOfMatches == matches.length) {

                for (let j = 0; j < matches.length; j++) {

                    // Evaluate the strings to access the data object properties
                    let valueWithBrackets = matches[j][0];
                    let value = eval('data.' + matches[j][1]) || eval('data["'+ matches[j][1] +'"]');
                    console.log(value);

                    _template = _template.replace(valueWithBrackets, value);
                }

                let parsedTemplateDocument = parse.parseFromString(_template, 'text/html').documentElement;
                let parsedTemplate = parsedTemplateDocument.getElementsByTagName('body')[0].firstElementChild;

                resolve(parsedTemplate);
            }

        }

        return template;
    });

};