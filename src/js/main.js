// require('babel/polyfill');

const bacon = require('baconjs');

require('domready')(function () {
    const btnSel     = 'register-button#comp1';
    const chckSel    = 'agreement-checkbox#comp2';
    const enableBtn  = switchRegisterBtn.bind(null, '0');
    const disableBtn = switchRegisterBtn.bind(null, '1');


    /**
     * Собственно, весь "медитор" - здесь.
     * Все взаимосвязи между компонентами собраны в одном месте.
     */
    dispatch({
        'register-button#comp1': [{
            'clicked'            : disableAgrCheckbox,
            'register-completed' : enableAgrCheckbox
        }, regButtonMapper],

        'agreement-checkbox#comp2': [{
            'enabled'  : enableBtn,
            'disabled' : disableBtn
        }, agrChckMapper]
    });
     


    // ----------------------------- EVENT MAPPERS -------------------------- //
    /**
     * Эти сущности нужны будут только если мы не договоримся,
     * что каждый веб-компонент триггерит "наверх" семантические эвенты
     * Т.е., event mappers - это просто способ сконвертить
     * низкоуровневые названия эвентов в более высокоуровневые,
     * отвечающие событиям бизнес-логики.
     */

    function regButtonMapper (node) {
        const btnClickStream = bacon
                  .fromEvent(node, 'click') 
                  .map({ name: 'clicked' });

        const btnAjaxStream  = bacon
                  .fromEvent(node, 'register-completed')
                  .map(function ( e ) { 
                      return { name: 'register-completed', payload: e };
                  });

        return bacon.mergeAll(btnClickStream, btnAjaxStream);
    }


    function agrChckMapper (node) {
        const agrClickStream    = streamChecked(node);

        const agrEnabledStream  = agrClickStream
                  .filter((x) => { return x; })
                  .map({ name: 'enabled' });

        const agrDisabledStream = agrClickStream
                  .filter((x) => { return !x; })
                  .map({ name: 'disabled' });

        return bacon.mergeAll(agrEnabledStream, agrDisabledStream);
    }

    
    // ----------------------------- BEHAVIOUR ------------------------------ //
    function streamChecked (node) {
        return bacon
            .fromEvent(node, 'change')
            .map((e) => { return e.target.checked; });
    }
    

    function disableAgrCheckbox () {
        document
            .querySelector(chckSel) 
            .querySelector('input') 
            .setAttribute('disabled', 'true');
    }

    function enableAgrCheckbox () {
        document
            .querySelector(chckSel) 
            .querySelector('input') 
            .removeAttribute('disabled' );
    }

    function switchRegisterBtn (val) {
        var prop = document
            .querySelector(btnSel) 
            .querySelector('register-button-model content[name="isDisabled"]' );

        prop.textContent = val;
    }
    
    
    // ----------------------------- MEDIATOR LIBRARY ----------------------- //
    function dispatch(scheme) {
        Object.keys(scheme).forEach(function (sel) {
            let component = scheme[sel];
            let events    = component[0];
            let mapper    = component[1];
            let node      = document.querySelector(sel);

            mapper(node).onValue((e) => { 
                console.log('mapper value :: ', e );
                events[e.name](e.payload); 
            });
        });
    }
});
