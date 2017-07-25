// Classes
let App = function(appName) {

    let rootElement = document.querySelector('[data-app="'+appName+'"]');
    if (!rootElement) throw 'Could not find root element '+appName;

    let router = new Router();

    this.template = function(_) {

        if (!_.route) throw 'No route was defined for this template';

        router.set(_, rootElement);
    };
};

let Route = function() {

    this.URI = null;
    this.parameter = null;
    this.component = null;

    let regex = /(#\w*\/)(\w*.\/){0,}(\:\w*\/?)?/;

    this.set = function(_, rootElement) {

        _.route = _.route.slice(-1) == '/' ? _.route : _.route+'/';

        if (!regex.test(_.route)) throw _.route + ' is not a valid URL';

        if (regex.exec(_.route)[3]) this.parameter = regex.exec(_.route)[3];

        this.URI = regex.exec(_.route)[1];

        if (regex.exec(_.route)[2]) this.URI+= regex.exec(_.route)[2];

        this.component = _;
        this.component['rootElement'] = rootElement;
    }

    this.getURIFromString = function(URL) {
        URL = URL.slice(-1) == '/' ? URL : URL+'/';

        let URI = '';

        if (!regex.test(URL)) throw URL + ' is not a valid URL';

        URI = regex.exec(URL)[1];

        if (regex.exec(URL)[2]) URI+= regex.exec(URL)[2];

        return URI;

    }

};

let Router = function() {

    var self = this;

    this.routes = [];

    this.set = function(_, rootElement) {

        let route = new Route();
        route.set(_, rootElement);

        self.routes.push(route);

        // On changing the hash navigate
        window.onhashchange = function(e) {

            let URI = new Route().getURIFromString(e.newURL);

            self.go(URI).then(
                () => console.log('Navigated to ' + route.URI),
                (err) => { console.log(err) }
            );
        };

    };

    this.go = function(URI, data) {
        return new Promise((resolve, reject) => {
            console.log(window.location);
            console.log(URI);
            URI = URI.slice(-1) == '/' ? URI : URI+'/';

            for (let i = 0; i < self.routes.length; i++) {

                if (self.routes[i].URI == URI) {

                    let _ = self.routes[i].component;
                    console.log(_);
                    loadTemplate(_.rootElement, _.templateURL).then(
                        (template) => {
                            let hook = _.hook && typeof(_.hook()) == 'object' ? _.hook() : {};

                            // Initiate actions before loading the view; may be overridden with hooks
                            if (hook.viewBeforeLoad) hook.viewBeforeLoad();

                            // Insert template in app route element
                            _.rootElement.insertBefore(template, _.rootElement.firstElementChild);

                            // Initiate actions after loading the view; may be overridden with hooks
                            if (hook.viewDidLoad) hook.viewDidLoad();

                            // Run component function
                            if (_.component) _.component(_, data);
                        },
                        (err) => { throw 'Error loading template:'+err }
                    );

                }
            }

            reject('Not a valid route in this application');

        })
    };

    // TODO
    this.back = function() {
        if ('lastHistoryWasAppURL') {
            window.history.back();
        }
    }

};

// Methods
let loadTemplate = function(rootElement, path) {

    return new Promise(function(resolve, reject) {

        let http = new XMLHttpRequest();

        http.onload = function() {
            if (this.status >= 200 && this.status < 300) {

                let parse = new DOMParser();
                let templateDocument = parse.parseFromString(this.responseText, 'text/html').documentElement;
                let template = templateDocument.getElementsByTagName('body')[0].firstElementChild;

                if (!template) return;

                // Clear target element before injecting new template
                rootElement.innerHTML = null;

                resolve(template);

            } else {
                reject(this.response);
            }

        };

        http.onerror = function() { reject(this.response) };

        http.open('GET', path);
        http.send();

    });

};