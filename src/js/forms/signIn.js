require('whatwg-fetch');
const Mustache = require('mustache');

export default {
    load(appId) {
        var view = { appId: appId };

        return fetch('/src/templates/signIn.html')
            .then((resp) => { return resp.text(); })
            .then((tmpl) => {
                // Mustache.parse(tmpl);   // optional, speeds up future uses
                const rendered = Mustache.render(tmpl, view);
                document.getElementById('app').innerHTML = rendered;
            });
    },

    bindEvents(FSM) {
        console.log( 'signInForm.bindEvents :: starts' );
        return new Promise(function (resolve, reject) {
            document
                .getElementById('sign-in-back')
                .addEventListener('click', FSM.goBack.bind(FSM));

            document
                .getElementById('sign-in-vk')
                .addEventListener('click', FSM.showSignVK.bind(FSM));

            document
                .getElementById('sign-in-fb')
                .addEventListener('click', FSM.showSignFB.bind(FSM));

            document
                .getElementById('sign-in-phone')
                .addEventListener('click', FSM.showSignPhone.bind(FSM));

            resolve(true);
        });
    }
};

