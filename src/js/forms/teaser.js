require('whatwg-fetch');
const Mustache = require('mustache');

export default {
    load(appId) {
        var view = { appId: appId };

        return fetch('/src/templates/teaser.html')
            .then((resp) => { return resp.text(); })
            .then((tmpl) => {
                // Mustache.parse(tmpl);   // optional, speeds up future uses
                const rendered = Mustache.render(tmpl, view);
                document.getElementById('app').innerHTML = rendered;
            });
    },

    bindEvents(FSM) {
        console.log( 'teserForm.bindEvents :: starts' );
        return new Promise(function (resolve, reject) {
            document
                .getElementById('sign-in')
                .addEventListener('click', FSM.showSignIn.bind(FSM));

            document
                .getElementById('sign-up')
                .addEventListener('click', FSM.showSignUp.bind(FSM));

            resolve(true);
        });
    }
};

