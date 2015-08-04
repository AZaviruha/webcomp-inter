require('whatwg-fetch');
const Mustache = require('mustache');

export default {
    load(appId) {
        var view = { appId: appId };

        return fetch('/src/templates/signUp.html')
            .then((resp) => { return resp.text(); })
            .then((tmpl) => {
                const rendered = Mustache.render(tmpl, view);
                document.getElementById('app').innerHTML = rendered;
            });
    },

    bindEvents(FSM) {
        return new Promise(function (resolve, reject) {
            document
                .getElementById('sign-up-back')
                .addEventListener('click', FSM.goBack.bind(FSM));

            document
                .getElementById('sign-up-vk')
                .addEventListener('click', FSM.showSignVK.bind(FSM));

            document
                .getElementById('sign-up-fb')
                .addEventListener('click', FSM.showSignFB.bind(FSM));

            document
                .getElementById('sign-up-phone')
                .addEventListener('click', FSM.showSignPhone.bind(FSM));

            resolve(true);
        });
    }
};

