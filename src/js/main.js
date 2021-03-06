// require('babel/polyfill');

const bacon = require('baconjs');

require('domready')(function () {
    const btnSel     = 'register-button#comp1';
    const chckSel    = 'agreement-checkbox#comp2';
    const enableBtn  = switchRegisterBtn.bind(null, '0');
    const disableBtn = switchRegisterBtn.bind(null, '1');


    /**
     * Собственно, весь "медиатор" - здесь.
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
     * 
     * Upd. Ну, кстати, это ещё и место, где можно сконвертировать payload от событий.
     * Например, если у нас есть функция, которая уже реализует нужный функционал,
     * но требует другой формат входных данных, чем те, которые приходят 
     * в событии компонента.
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
        return streamChecked(node)
            .map((x) => {
                return { name: x ? 'enabled' : 'disabled' };
            });
    }

    
    // ----------------------------- BEHAVIOUR ------------------------------ //
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
            let component         = scheme[sel];
            let [events, mapper]  = component;
            let node              = document.querySelector(sel);

            mapper(node).onValue((e) => { 
                console.log('mapper value :: ', e );
                events[e.name](e.payload); 
            });
        });
    }
    

    // ----------------------------- UTILS ---------------------------------- //
    function streamChecked (node) {
        return bacon
            .fromEvent(node, 'change')
            .map((e) => { return e.target.checked; });
    }
    

});
