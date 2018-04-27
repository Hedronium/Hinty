((window) => {
    const doc = window.document;

    const findHint = (el) => {
        if (el.className === 'HintyHints') {
            return null;
        }

        if (el.className === 'HintyHint') {
            return el;
        } else {
            return findHint(el.parentNode);
        }
    }

    const clearChildren = (el) => {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    const makeHintContainer = () => {
        const container = doc.createElement('div');
        container.className = 'HintyHints HintyHintsHidden';

        return container;
    }

    const makeHint = (title, description, off) => {
        let str =  '';

        const hint = doc.createElement('div');
        hint.className = 'HintyHint';

        hint.dataset.off = off;

        const hint_title = doc.createElement('div');
        hint_title.className = 'HintyHintTitle';
        hint_title.innerText = title;

        const hint_description = doc.createElement('div');
        hint_description.className = 'HintyHintDescription';
        hint_description.innerText = description;

        hint.appendChild(hint_title);
        hint.appendChild(hint_description);

        return hint;
    }

    window.Hinty = (target, hinter = () => {}) => {
        const hints_container = makeHintContainer();

        hints_container.addEventListener('click', (ev) => {
            let target = findHint(ev.target);

            if (target) {
                off = target.dataset.off;
                place();
            }
        });

        const caret = doc.createElement('div');
        caret.className = 'HintyCaret';

        const interceptor = doc.createElement('input');
        interceptor.setAttribute('type', 'text');
        interceptor.className = 'HintyInterceptor';
        
        const container = doc.createElement('div');
        container.className = 'HintyContainer';

        const shadow = doc.createElement('div');
        shadow.className = 'HintyShadow';

        container.appendChild(interceptor);
        container.appendChild(shadow);
        target.replaceWith(container);
        container.appendChild(target);
        container.appendChild(hints_container);

        target.classList.add('HintyField');

        container.style.width = `${target.offsetWidth}px`;
        container.style.height = `${target.offsetHeight}px`;

        const styles = window.getComputedStyle(target);

        Object.keys(styles).forEach(key => {
            shadow.style[key] = styles[key];
        });

        let pos = 0;

        const getPos = () => {
            if (target.selectionStart !== target.selectionEnd) return;
            pos = target.selectionStart;
        }

        let hints = [];

        const render = () => {
            clearChildren(hints_container);

            hints_container.style.top = `calc(${caret.offsetTop}px + 1em)`;
            hints_container.style.left = `${caret.offsetLeft}px`;

            hints_container.classList.remove('HintyHintsHidden');
        }

        const callback = (title, description, substitute) => {
            interceptor.focus();

            if (!isOpen()) {
                render();
            }

            const el = makeHint(title, description, hints.length);
            hints_container.appendChild(el);

            if (!isOpen()) {
                el.classList.add('HintyHintActive');
            }
            
            hints.push({
                title, description, substitute, el
            });
        };

        let last_content = '';
        let last_pos = '';

        const hint = (click = false) => {
            if (click || target.value !== last_content || pos !== last_pos) {
                hinter(target.value, pos, callback);

                last_content = target.value;
                last_pos = pos;
            }
        }

        const clearHints = () => {
            hints = [];
            off = 0;
        };

        const changeListener = () => {
            clearChildren(shadow);

            let pref = doc.createTextNode(target.value.substr(0, pos));
            let suff = doc.createTextNode(target.value.substr(pos));

            shadow.appendChild(pref);
            shadow.appendChild(caret);
            shadow.appendChild(suff);
        };

        const isOpen = () => !!hints.length;

        target.addEventListener('keyup', (ev) => {
            getPos();
            changeListener();
            clearHints();
            hint();
        });

        target.addEventListener('mouseup', () => {
            getPos();
            changeListener();
            clearHints();
            hint(true);
        });

        let off = 0;

        const removeHighlight = () => {
            hints[off].el.classList.remove('HintyHintActive');
        }

        const highlight = () => {
            hints_container.scrollTop = hints[off].el.offsetTop;
            hints[off].el.classList.add('HintyHintActive');
        }

        const scrubDown = () => {
            removeHighlight();

            off = (off + 1)%hints.length;

            highlight();
        }

        const scrubUp = () => {
            removeHighlight();

            let new_hint = (off - 1);

            if (new_hint < 0) {
                new_hint = hints.length - 1;
            }

            off = new_hint;

            highlight();            
        }

        const close = () => {
            hints_container.classList.add('HintyHintsHidden');
            target.focus();
        }

        const place = () => {
            let str =
                target.value.substr(0, pos)
                + hints[off].substitute

            target.selectionStart = target.selectionEnd = str.length;
            str += target.value.substr(pos);

            interceptor.value = '';

            target.value = str;

            close();
            
            getPos();
            changeListener();
            clearHints();
        }

        interceptor.addEventListener('keyup', (ev) => {
            switch (ev.key) {
                case 'ArrowUp':
                    scrubUp();
                    break;

                case 'ArrowDown':
                    scrubDown();
                    break;

                case 'Enter':
                    place();
                    break;

                case 'Escape':
                    close();
                    break;

                case 'Backspace':
                    str =
                        target.value.substr(0, pos-1)
                        + interceptor.value

                    target.selectionStart = target.selectionEnd = str.length;
                    str += target.value.substr(pos);

                    interceptor.value = '';

                    target.value = str;
                    
                    close();
                    getPos();
                    changeListener();
                    clearHints();
                    hint();
                    break;

                default:
                    if (interceptor.value === '') return;

                    str =
                        target.value.substr(0, pos)
                        + interceptor.value

                    target.selectionStart = target.selectionEnd = str.length;
                    str += target.value.substr(pos);

                    interceptor.value = '';

                    target.value = str;
                    
                    close();
                    getPos();
                    changeListener();
                    clearHints();
                    hint();
            }
        });
    };
})(window);