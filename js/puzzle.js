document.addEventListener('DOMContentLoaded',function($) {
    // ForEach Nodelist Polyfill IE9
    // https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
    if (window.NodeList && !NodeList.prototype.forEach) {
      NodeList.prototype.forEach = function (callback, thisArg) {
          thisArg = thisArg || window;
          for (var i = 0; i < this.length; i++) {
              callback.call(thisArg, this[i], i, this);
          }
      };
    }

    this.Puzzle = function(opts) {
        var instance = this;
        this.container;
        this.fullImg = new Image();
        this.grid;
        this.gridSize;
        this.usropts = opts;
        this.difficulty;
        this.settings = {
            el             : null,
            image          : 'http://ansimuz.com/site/wp-content/uploads/2015/01/making-mega-man-big.png',
            numcolumns     : 3,
            numrows        : 3,
            difficulty     : "normal",
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

            // execute remain functions after image loads
            var img = new Image();
            var width,height;
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
            var usropts = (opts) ? opts : instance.settings;

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
            var tmpImg = new Image();
            tmpImg.onload = function() {
                instance.usropts.image = src;
            }
            tmpImg.src = src;

            return instance;
        }

        this.isSorted = function(array) {
            var array = (array) ? array : instance.getTiles();
            var i = 0;
            var keys = Object.keys(array);
            var totalelements = array.length;

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
            var array=[];

            instance.grid.childNodes.forEach(function(child,index){
                if(child.nodeType != 3 && child.nodeName != 'IMG') {
                    var arr = [];
                    arr[0] = Number(child.children[0].dataset.position) - 1;
                    arr[1] = child.children[0];
                    array[index] = arr;
                    child.children[0].style.zIndex = 1;
                }
            });

            return array;
        }

        this.correctTiles = function(array) {
            var array = (array) ? array : instance.getTiles();
            var i = 0;
            var keys = Object.keys(array);
            var totalelements = array.length;
            var number_correct = 0;

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
            var afterImage;
            var lastPlace;
            var divs = document.querySelectorAll(".shell li div");
            var homeEvt = new CustomEvent('home', {
                detail: {
                    self: instance,
                }
            });

            divs.forEach(function(div){
                div.addEventListener('home', function(evt){
                    // ...

                    if(instance.settings.debug) {
                        console.info(evt);
                    }
                });
            });

            divs.forEach(function(div){
                div.addEventListener('mousedown', function(evt) {
                    this.classList.add('highlight');
                    afterImage = this.cloneNode(true);
                    $(afterImage).css({
                        'position':'absolute',
                        'opacity':'.4',
                        'top':'0',
                        'left':'0',
                        'margin-top':'0',
                        'margin-left':'0',
                        'z-index':'-1'
                    });
                    lastPlace = this.parentNode;
                    lastPlace.appendChild(afterImage);
                });

                div.addEventListener('mouseup', function(evt) {
                    lastPlace.removeChild(lastPlace.children[1]);
                    this.classList.remove('highlight');
                    this.style.background = 'transparent';
                    this.style.zIndex = 1;
                });
            });

            $(".shell li div").draggable({
                revert: true,
                zIndex: 3,
                snap: ".shell li",
                snapMode: "inner",
                snapTolerance: 10,
                create: function(event, ui) {

                },
                start: function (event, ui) {
                    
                },
                drag: function (event, ui) {
                    
                },
                stop: function (event, ui) {
                    
                }
            });

            instance.grid.childNodes.forEach(function(child,index) {
                if(child.nodeType != 3 && child.nodeName != 'IMG') {
                    $(child).droppable({
                        drop: function(event, ui) {
                            var tile = ui.draggable;
                            var slot  = this;

                            $(this).removeClass('highlight');

                            if ($(slot).children().length > 0) {
                                $(slot)
                                    .children()
                                    .detach()
                                    .prependTo($(lastPlace));
                            }

                            $(tile)
                                .detach()
                                .css({ top: 0, left: 0 })
                                .prependTo($(slot));

                            instance.correctTiles();

                            if (instance.isSorted(instance.getTiles())) {
                                $(instance.fullImg).css({'opacity':1,'z-index':1});
                            }


                            if (Array.from(instance.grid.children).indexOf(slot) == Number(tile[0].dataset.position) - 1) {
                                tile[0].dispatchEvent(homeEvt);
                            }

                            // debugger
                            if (instance.settings.debug) {
                                console.info(instance);
                                console.info("Dropped tile #" + (Number(tile[0].dataset.position)) + " in slot #" + (Array.from(instance.grid.children).indexOf(slot) + 1));
                                console.info(tile[0]);
                                console.info(slot);
                            }
                        },
                        over: function(event, ui) {
                            $(this).addClass('highlight');
                        },
                        out: function(event, ui) {
                            $(this).removeClass('highlight');  
                        }
                    });
                }
            });

            window.addEventListener('resize',function(evt) {
                setFrameDimensions(instance.grid,instance.container);
            });
        }

        function setFrameDimensions(grid,container) {
            var containerWidth = container.offsetWidth;

            // accounts for left/right padding
            var padding = 0;
            var paddingArr = [
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
            var gridArr = [];
            var i = 0;
            var currentRow = 0;
            var currentColumn = 1;
            instance.grid = document.createElement('ul');
            instance.gridSize = numcolumns * numrows;

            while(i<instance.gridSize) {
                // build html
                var tmpLi = document.createElement('li');
                var tmpDiv = document.createElement('div');
                var tmpImg = document.createElement('img');
                var tmpArr = [];

                $(tmpLi).css({
                    'height'    : (100/numrows)+'%',
                    'max-width' : (100/numcolumns)+'%',
                    'flex'      : '1 0 '+(100/numcolumns)+'%'
                });

                tmpDiv.classList.add('puzzle');
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

            instance.grid.classList.add("shell");
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
            var shuffle_limit = array.length - Math.ceil(array.length * instance.difficulty);
            var m = array.length, t, i;

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