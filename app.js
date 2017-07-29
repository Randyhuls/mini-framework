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
            title: {  test: { lol: 'hiiii'}},
            subTitle: 'Bye'
        },
        controller: function(component, params) {
            console.log('params', params);

            console.log(component);
        }
    }

);

let user = new app.component({
        templateURL: 'user.template.html',
        route: '#user/:id',
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
          userId: null
        },
        controller: function(component, params) {
            this.data.data.userId = 1;

            // The view that is required is the RAW view with bracket elements, otherwise parseTemplate wont run
            component.updateView(this.data);

        }
    }

);

app.init();