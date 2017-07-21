let App = function(appName) {

    let rootElement = document.querySelector('[data-app="'+appName+'"]');
    if (!rootElement) throw 'Could not find root element '+appName;

    this.template = function(config) {

        // ViewBeforeEnter

        let viewBeforeEnter = function() {
            return new Promise((resolve, reject) => {

            })
        };

        // ViewDidLoad

        let viewDidLoad = function() {
            return new Promise((resolve, reject) => {

            })
        };

        getHTMLFileFromDirectory(rootElement, config.path).then(
            (template) => {

                viewBeforeEnter();

                // Insert template in app route element
                rootElement.insertBefore(template, rootElement.firstElementChild);

                viewDidLoad();

            },
            (err) => { throw 'Error loading template:'+err }
        );



        this.component = function() {

        };
    };
};



let getHTMLFileFromDirectory = function(rootElement, path) {

    return new Promise(function(resolve, reject) {

        let http = XMLHttpRequest();

        http.onload = function() {
            if (this.status >= 200 && this.status < 300) {

                let parse = new DOMParser();
                let templateDocument = parse.parseFromString(this.response, 'text/html').documentElement;
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

let app = new App('MyApp');

