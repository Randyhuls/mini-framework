let app = new App('MyApp');
app.router.rootPage = '#home/';

let home = new app.component({
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
        data: {
            title: 'Home page',
            subTitle: 'Some test subtitle'
        },
        controller: function(component, params) {

        }
    }

);

let user = new app.component({
        templateURL: 'user.template.html',
        route: '#user/:id',
        selector: '',
        hook: function() {
            this.viewBeforeLoad = function(component, params) {
                console.log('viewBeforeLoad');

                component.data.data = {
                    userId: params.id
                };
            };

            this.viewDidLoad = function(component, params) {
                console.log('viewDidLoad');
            };

            return this;
        },
        controller: function(component, params) {


        }
    }

);

app.init();