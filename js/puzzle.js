document.addEventListener('DOMContentLoaded',function($) {
    // ForEach Nodelist Polyfill IE9
    // https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
    if (window.NodeList && !NodeList.prototype.forEach) {
      NodeList.prototype.forEach = function (callback, thisArg) {
          thisArg = thisArg || window;
          for (let i = 0; i < this.length; i++) {
              callback.call(thisArg, this[i], i, this);
          }
      };
    }

    this.Puzzle = function(opts) {
        const instance = this;
        this.container;
        this.fullImg = new Image();
        this.grid;
        this.key;
        this.gridSize;
        this.usropts = opts;
        this.difficulty;
        this.settings = {
            el             : null,
            image          : 'http://ansimuz.com/site/wp-content/uploads/2015/01/making-mega-man-big.png',
            numcolumns     : 3,
            numrows        : 3,
            difficulty     : "normal",
            dropped        : function(evt) { },
            correct        : function(evt) { },
            finished       : function(evt) { },
            debug          : false,
        };


        // Public Methods
        this.init = function() {
            instance.setOpts(instance.usropts);
            instance.setDifficulty(instance.settings.difficulty);

            // set container
            if (instance.settings.el) {
                instance.container = instance.settings.el; 
            } else {
                console.error('No "el" option detected. Please specify an element to attach puzzle to.');
                return false;
            }

            // execute remaining functions after image loads
            let img = new Image();
            let width,height;
            img.onload = function() {
                // set max height to viewport height
                if(this.height > window.innerHeight) {
                    height = window.innerHeight;
                    width = height * (this.width/this.height);
                } else {
                    width = this.width;
                    height = this.height;
                }

                // set grid height/width based on image dimensions
                instance.settings.width = width;
                instance.settings.height = height;

                // insert html into DOM
                instance.grid = buildGrid(instance.settings.numcolumns,instance.settings.numrows);
                instance.correctTiles();
                instance.container.innerHTML = "";
                instance.container.appendChild(instance.grid,instance.container.children[0]);
                setFrameDimensions(instance.grid,instance.container);
                setEventHandlers(instance.grid);
            }
            img.src = instance.settings.image;

            return instance;
        }

        this.setOpts = function(opts) {
            let usropts = (opts) ? opts : instance.settings;

            // set user options
            Object.keys(instance.usropts).forEach(function(key) {
                (instance.settings[key] !== (undefined || null || '')) ? instance.settings[key] = instance.usropts[key] : ''; 
            });

            return instance;
        }

        this.setDifficulty = function(difficulty) {
            switch(difficulty) {
                case "easy":
                    instance.difficulty = .25;
                    break;

                case "normal":
                    instance.difficulty = .50;
                    break;

                case "hard":
                    instance.difficulty = .75;
                    break;
                    
                case "expert":
                    instance.difficulty = 1;
                    break;

                default:
                    instance.difficulty = .50;  
            }

            instance.usropts.difficulty = difficulty;

            return instance;
        }

        this.setGridSize = function(obj) {
            Object.keys(obj).forEach(function(value){
                if (value == "numrows" && typeof Number(obj[value]) == "number") {
                    instance.usropts.numrows = obj[value];
                }

                if (value == "numcolumns" && typeof Number(obj[value]) == "number") {
                    instance.usropts.numcolumns = obj[value];
                }
            });
            
            return instance;
        }

        this.setImage = function(src) {
            let tmpImg = new Image();
            tmpImg.onload = function() {
                instance.usropts.image = src;
            }
            tmpImg.src = src;

            return instance;
        }

        this.isSorted = function(array) {
            array = (array) ? array : instance.getTiles();
            let i = 0;
            let keys = Object.keys(array);
            let totalelements = array.length;

            while (totalelements > 1) {
                // Compare current index against original index
                if (Number(keys[i]) == Number(array[i][0])) {
                    i++;
                    totalelements--;
                } else {
                    return false;
                }
            }

            return true;
        }

        this.getTiles = function() {
            let array=[];

            instance.grid.childNodes.forEach(function(child,index){
                if(child.nodeType != 3 && child.nodeName != 'IMG') {
                    let arr = [];
                    arr[0] = Number(child.children[0].dataset.position) - 1;
                    arr[1] = child.children[0];
                    array[index] = arr;
                    child.children[0].style.zIndex = 1;
                }
            });

            return array;
        }

        this.correctTiles = function(array) {
            array = (array) ? array : instance.getTiles();
            let i = 0;
            let keys = Object.keys(array);
            let totalelements = array.length;
            let number_correct = 0;

            while (totalelements > 0) {
                
                // Compare current index against original index
                if (Number(keys[i]) == Number(array[i][0])) {
                    array[i][1].children[0].dataset.overlay = 'show';
                    number_correct++;
                } else {
                    array[i][1].children[0].dataset.overlay = '';
                }

                i++;
                totalelements--;
            }

            return number_correct;
        }

        // Private Methods
        function setEventHandlers(grid) {
            let afterImage;
            let lastPlace;
            let slots = document.querySelectorAll(".frame li");
            let tiles = document.querySelectorAll(".frame li div");
            let mouseX;
            let mouseY;

            // Define mouse position while dragging tile
            document.addEventListener('dragover',function(evt){
                mouseX = evt.clientX;
                mouseY = evt.clientY;
            });

            // Reset mouse position after tile has been let go
            document.addEventListener('mousemove',function(evt){
                mouseX = evt.clientX;
                mouseY = evt.clientY;
            });

            // Reset animation class
            document.addEventListener('transitionend',function(evt){
                evt.target.classList.remove('animate');
            });

            slots.forEach(function(slot,index,collection){
                slot.addEventListener('home', function(evt) {
                    return evt;
                });

                let clone = slot.cloneNode(true);
                let isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
                let key = 0;
                let startX;
                let startY;
                let screentStartX;
                let screenStartY;
                let lastPlace;

                // Set X/Y position for when slot is dragged

                slot.addEventListener('mousemove', function(evt){
                    startX = evt.offsetX;
                    startY = evt.offsetY;
                    screenStartX = evt.clientX;
                    screenStartY = evt.clientY;
                });

                // Mouse events

                slot.addEventListener('mousedown', function(evt) {
                    this.children[0].classList.add('highlight');
                    $(clone).css({
                        'position':'absolute',
                        'opacity':'.4',
                        'top': this.getBoundingClientRect().top - this.parentNode.getBoundingClientRect().top,
                        'left': this.getBoundingClientRect().left - this.parentNode.getBoundingClientRect().left,
                        'margin-top':'0',
                        'margin-left':'0',
                        'z-index':'-2',
                        'overflow':'hidden',
                        'outline':'1px solid #000'
                    });
                    this.draggable = true;
                });

                slot.addEventListener('mouseup', function(evt){
                    this.children[0].classList.remove('highlight');
                    this.style.transform = "";
                    this.removeAttribute('draggable');
                });
                
                // Drag events

                slot.addEventListener('dragstart',function(evt){
                    let dt = evt.dataTransfer;

                    if (isIE11) {
                        // var initialDisplay = evt.srcElement.style.display;
                        // evt.srcElement.style.display = "none";
                        // window.setTimeout(function(){
                        //     evt.srcElement.style.display = initialDisplay;
                        // });
                    } else {    
                        dt.setDragImage(new Image(),0,0);
                        dt.setData('key',index);
                    }

                    // Set key to index of dragged element
                    let slot = this;
                    Object.keys(collection).forEach(function(index) {
                        if (collection[index].children[0].dataset.position == slot.children[0].dataset.position ) {
                            instance.key = index;
                        }
                    });
                });

                slot.addEventListener('drag', function(evt){
                    if( mouseY > startY &&
                        mouseX > startX &&
                        mouseY < window.innerHeight - (evt.target.offsetHeight - startY) &&
                        mouseX < window.innerWidth - (evt.target.offsetWidth - startX)) {
                        // evt.target.style.transform = "translate(" + (mouseX - screenStartX) + "px," + (mouseY - screenStartY) + "px" + ")";
                    }
                });

                slot.addEventListener('dragend', function(evt){
                    // Slight delay to smoothly move slot back in place
                    setTimeout(function(){
                        evt.target.classList.add('animate');
                        evt.target.style.transform = "translate(0px,0px)";
                    }, 100);
                });

                // Touch events for mobile

                slot.addEventListener('touchstart',function(evt) {
                    startY = Math.round(evt.touches[0].clientY - evt.target.getBoundingClientRect().top);
                    startX = Math.round(evt.touches[0].clientX - evt.target.getBoundingClientRect().left);
                    screenStartX = evt.touches[0].clientX;
                    screenStartY = evt.touches[0].clientY;

                    this.children[0].classList.add('highlight');
                    lastPlace = this.cloneNode(true);
                    $(lastPlace).css({
                        'position':'absolute',
                        'opacity':'.4',
                        'top': this.getBoundingClientRect().top - this.parentNode.getBoundingClientRect().top,
                        'left': this.getBoundingClientRect().left - this.parentNode.getBoundingClientRect().left,
                        'margin-top':'0',
                        'margin-left':'0',
                        'z-index':'-1',
                    });
                    this.parentNode.appendChild(lastPlace);
                    this.style.zIndex = 10;
                });

                slot.addEventListener('touchmove',function(evt) {
                    if( evt.touches[0].clientY > startY &&
                        evt.touches[0].clientX > startX &&
                        evt.touches[0].clientY < window.innerHeight - (evt.target.offsetHeight - startY) &&
                        evt.touches[0].clientX < window.innerWidth - (evt.target.offsetWidth - startX)) {
                        // evt.target.style.zIndex = 10;
                        // evt.target.parentNode.style.zIndex = 10;
                        // evt.target.style.transform = "translate(" + (evt.touches[0].clientX - screenStartX) + "px," + (evt.touches[0].clientY - screenStartY) + "px" + ")";
                    }
                });

                slot.addEventListener('touchend',function(evt){
                    // Slight delay to smoothly move slot back in place
                    setTimeout(function(){
                        evt.target.classList.add('animate');
                        evt.target.style.transform = "translate(0px,0px)";
                    },100);
                });

                // Reset slot

                slot.addEventListener('transitionend', function(evt) {
                    // Remove highlight
                    if (evt.target.style.transform == "translate(0px, 0px)") {   
                        if(lastPlace != undefined) {
                            lastPlace.remove();
                        }
                        this.children[0].classList.remove('highlight');
                        this.style.zIndex = "";
                        this.style.transform = "";
                    }
                });

                // Drop events

                slot.addEventListener('dragenter', function(evt){
                    evt.preventDefault();
                    if (!this.draggable) {
                        this.classList.add('highlight');
                    }
                });

                slot.addEventListener('dragover', function(evt){
                    evt.preventDefault();
                });

                slot.addEventListener('dragleave',function(evt){
                    evt.preventDefault();
                    if (!this.draggable) {
                        this.classList.remove('highlight');
                    }
                });

                slot.addEventListener('drop', function(evt){
                    evt.preventDefault();

                    let slot = this;
                    let dragSlot = slots[instance.key];
                    let tile = slot.children[0];
                    let dragTile = dragSlot.children[0];

                    // Remove highlights
                    dragTile.classList.remove('highlight');
                    slot.classList.remove('highlight');

                    // Disable drag
                    dragSlot.removeAttribute('draggable');
                    slot.removeAttribute('draggable');

                    // Swap tiles
                    slot.appendChild(dragTile);
                    dragSlot.appendChild(tile);

                    // check correct number of tiles
                    instance.correctTiles();

                    let tileInPlace = ( Array.from(instance.grid.children).indexOf(slot) == 
                                        Number(tile.dataset.position) - 1 );
                    let prevTileInPlace = ( Array.from(instance.grid.children).indexOf(dragSlot.parentNode) == 
                                            Number(dragTile.dataset.position) - 1 );

                    // prepare custom event
                    let homeEvt = new CustomEvent('home', {
                        detail: {
                            self: instance,
                            dropped: 
                            {
                                el: tile,
                                position: tile.dataset.position,
                                inPlace: tileInPlace,
                            },
                            dragged: 
                            {
                                el: dragTile,
                                position: dragTile.dataset.position,
                                inPlace: prevTileInPlace,
                            }
                        }
                    });

                    // trigger custom event on drop
                    if( instance.settings.dropped
                        && typeof instance.settings.dropped === "function") {
                        instance.settings.dropped(homeEvt);
                    }

                    // puzzle completed state
                    if (instance.isSorted(instance.getTiles())) {
                        // user defined callback
                        if( instance.settings.finished 
                            && typeof instance.settings.finished === "function") {
                            instance.settings.finished(homeEvt);
                        }
                    }

                    // check if current tile is placed correctly
                    if (tileInPlace || prevTileInPlace) {
                        // user defined callbacks
                        if( instance.settings.correct 
                            && typeof instance.settings.correct === "function") {
                            instance.settings.correct(homeEvt);
                        }
                    }

                    // debug output
                    if (instance.settings.debug) {
                        console.info(instance);
                        console.info("Dropped tile #" + (Number(tile[0].dataset.position)) + " in slot #" + (Array.from(instance.grid.children).indexOf(slot) + 1));
                        console.info(tile[0]);
                        console.info(slot);
                    }
                });

            });

            window.addEventListener('resize',function(evt) {
                setFrameDimensions(instance.grid,instance.container);
            });
        }

        function setFrameDimensions(grid,container) {
            let containerWidth = container.offsetWidth;

            // accounts for left/right padding
            let padding = 0;
            let paddingArr = [
                window.getComputedStyle(container).paddingRight,
                window.getComputedStyle(container).paddingLeft,
            ];
            paddingArr.forEach(function(value) {
                padding += parseInt(value);
            });

            // subtract padding from container width
            containerWidth = containerWidth - padding;

            $(grid).css({
                'max-width'  : instance.settings.width + 'px',
                'max-height' : instance.settings.height + 'px',
                'height'     : 'calc(' + containerWidth + "px * " + "(" + instance.settings.height + "/" + instance.settings.width + ")" +')'
            });
        }

        function buildGrid(numcolumns,numrows) {
            let gridArr = [];
            let i = 0;
            let currentRow = 0;
            let currentColumn = 1;
            instance.grid = document.createElement('ul');
            instance.gridSize = numcolumns * numrows;

            while(i<instance.gridSize) {
                // build html
                let tmpLi = document.createElement('li');
                let tmpDiv = document.createElement('div');
                let tmpImg = document.createElement('img');
                let tmpArr = [];

                $(tmpLi).css({
                    'height'    : (100/numrows)+'%',
                    'max-width' : (100/numcolumns)+'%',
                    'flex'      : '1 0 '+(100/numcolumns)+'%'
                });
                // tmpLi.draggable = "true";

                tmpDiv.dataset.position = i+1;
                
                tmpImg.src = instance.settings.image;
                tmpImg.style.position = "relative";
                tmpImg.style.width = 100*numcolumns+"%";

                // sets top alignment of image
                if(((i+1)%(Math.floor(instance.gridSize/numrows)))==0) {
                    tmpImg.style.top = -(100*currentRow)+"%";
                    currentRow++;
                } else {
                    tmpImg.style.top = -(100*currentRow)+"%";
                }

                // sets left alignment of image
                if((i)%numcolumns != 0) {
                    tmpImg.style.left = -(100*currentColumn) + "%";
                    currentColumn++;
                } else {
                    currentColumn = 1;
                }

                // Append elements
                tmpDiv.appendChild(tmpImg);
                tmpLi.appendChild(tmpDiv);
                tmpArr[0] = i; // original position number
                tmpArr[1] = tmpLi;
                gridArr.push(tmpArr);
                i++;
            }

            instance.grid.classList.add("frame");
            instance.grid.classList.add("no-select");

            gridArr = shuffleArr(gridArr);
            gridArr.forEach(function(piece,index,arr) {
                instance.grid.appendChild(piece[1]);
                instance.grid.appendChild(instance.fullImg);
            });

            instance.fullImg.src = instance.settings.image;
            instance.fullImg.classList.add('full-img');
            instance.fullImg.style.opacity = 0;
            instance.fullImg.style.zIndex = -1;

            return instance.grid;
        }

        function shuffleArr(array) {
            let shuffle_limit = array.length - Math.ceil(array.length * instance.difficulty);
            let m = array.length, t, i;

            // keep shuffle limit under total items
            shuffle_limit = (shuffle_limit < (m - 1)) ? shuffle_limit : 0;

            // set threshold for shuffling
            m = (m - shuffle_limit > 0) ? m - Math.abs(shuffle_limit) : 2;

            // while there remain elements to shuffle
            while (m) {

                // pick a remaining element
                i = Math.floor(Math.random() * (m-1)+1);

                if (m<0) {
                    break;
                } else {
                    m--;
                }

                // and swap it with the previous element.
                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }

            // always return shuffled array
            if(instance.isSorted(array)) {
                shuffleArr(array);
            }

            // make sure array never has a correct tile on expert
            if(instance.difficulty == 1 && instance.correctTiles(array)) {
                shuffleArr(array);
            }

            return array;
        }

        // return 'this' instance upon creation
        return this;
    }
}(jQuery));