require('whatwg-fetch');
const Mustache = require('mustache');


/**
 * Эмулирует модель веб-компонента
 */
var model = { 
    signInMsg: 'Войти',
    signUpMsg: 'Зарегистрироваться',
    login: '',
    passw: '',
    errors: {
        emptyLogin: false,
        emptyPassw: false
    }
};


var template = '';

export default {
    load(appId) {
        model.login = '';
        model.passw = '';
        model.errors.emptyLogin = false;
        model.errors.emptyPassw = false;

        return fetch('/src/templates/signIn.html')
            .then((resp) => { return resp.text(); })
            .then((tmpl) => {
                template = tmpl;
                dom('#app').html(Mustache.render(template, model));
            });
    },

    bindEvents(FSM) {
        return new Promise(function (resolve, reject) {
            handleSignIn(FSM);
            resolve(true);
        });
    }
};


function handleSignIn (FSM) {
    dom('#sign-in-back').on('click', FSM.goBack.bind(FSM));
    dom('#sign-in-vk').on('click', FSM.showSignVK.bind(FSM));
    dom('#sign-in-fb').on('click', FSM.showSignFB.bind(FSM));

    dom('#sign-in-phone').on('click', function () {
        const login = dom('#login').val();
        const passw = dom('#password').val();
        model.login = login;
        model.passw = passw;
        model.errors.emptyLogin = !login;
        model.errors.emptyPassw = !passw;

        if (!login || !passw) {
            dom('#app').html(Mustache.render(template, model));
            handleSignIn(FSM);
        } else {
            FSM.goBack();
        }
    });
}


function dom(sel) {
    const el = document.querySelector(sel);
    return {
        on(e, f) {
            el.addEventListener(e, f);
            return this;
        },
        html(text) {
            el.innerHTML = text;
            return this;
        },
        val(v) { 
            if (v) el.value = v;
            return el.value; 
        },
        el: el
    };
}
