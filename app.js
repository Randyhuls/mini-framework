let app = new App('MyApp');

let home = app.template({
        templateURL: 'home.template.html',
        route: '#home/',
        hook: function() {
            this.viewBeforeLoad = function() {
                console.log('viewBeforeLoad');
            };

            this.viewDidLoad = function() {
                console.log('viewDidLoad');
            };

            return this;
        },
        component: function(route, data) {
            console.log('component', route);
            console.log('data', data);
        }
    }

);

let user = app.template({
        templateURL: 'user.template.html',
        route: '#home/user/',
        hook: function() {
            this.viewBeforeLoad = function() {
                console.log('viewBeforeLoad');
            };

            this.viewDidLoad = function() {
                console.log('viewDidLoad');
            };

            return this;
        },
        component: function(route, data) {
            console.log('component', route);
            console.log('data', data);
        }
    }

);