(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape || !$) {
      return;
    } // can't register if cytoscape unspecified

    var options = {
      node: {
        highlighted: {
          'border-color': '#0B9BCD',  //blue
          'border-width': 3
        },

        highlighted2: {
          'border-color': '#04F06A',  //green
          'border-width': 3
        },
        highlighted3: {
          'border-color': '#F5E663',   //yellow
          'border-width': 3
        },
        highlighted4: {
          'border-color': '#BF0603',    //red
          'border-width': 3
        },
        selected: {
          'border-color': 'black',
          'border-width': 3,
          'background-color': 'lightgrey'
        }

      },
      edge: {
        highlighted: {
          'line-color': '#0B9BCD',    //blue
          'width' : 3
        },
        highlighted2: {
          'line-color': '#04F06A',   //green
          'width' : 3
        },
        highlighted3: {
          'line-color': '#F5E663',    //yellow
          'width' : 3
        },
        highlighted4: {
          'line-color': '#BF0603',    //red
          'width' : 3
        },
        selected: {
          'line-color': 'black',
          'width' : 3
        }
      },
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      zoomAnimationDuration: 1500, //default duration for zoom animation speed
      neighbor: function(node){ // return desired neighbors of tapheld node
        return false;
      },
      neighborSelectTime: 500 //ms, time to taphold to select desired neighbors
    };


    var undoRedo = _dereq_("./undo-redo");
    var viewUtilities = _dereq_("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      // If 'get' is given as the param then return the extension instance
      if (opts === 'get') {
        return getScratch(cy).instance;
      }

      $.extend(true, options, opts);

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }


      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;

        // create a view utilities instance
        var instance = viewUtilities(cy, options);

        if (cy.undoRedo) {
          var ur = cy.undoRedo(null, true);
          undoRedo(cy, ur, instance);
        }

        // set the instance on the scratch pad
        getScratch(cy).instance = instance;

        var shiftKeyDown = false;
        document.addEventListener('keydown', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = true;
          }
        });
        document.addEventListener('keyup', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = false;
          }
        });
        //Select the desired neighbors after taphold-and-free
        cy.on('taphold', 'node', function(event){
          var target = event.target || event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){
            if(shiftKeyDown){
              cy.elements().unselect();
              neighborhood = options.neighbor(target);
              neighborhood.select();
              target.lock();
              tapheld = true;
            }
          }, options.neighborSelectTime - 500);
          cy.on('free', 'node', function(){
            var targetTapheld = event.target || event.cyTarget;
            if(target == targetTapheld && tapheld === true){
              tapheld = false;
              neighborhood.select();
              target.unlock();
            }
            else{
              clearTimeout(timeout);
            }
          });
          cy.on('drag', 'node', function(){
            var targetDragged = event.target || event.cyTarget;
            if(target == targetDragged && tapheld === false){
              clearTimeout(timeout);
            }
          })
        });
      }

      // return the instance of extension
      return getScratch(cy).instance;
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-view-utilities', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined' && typeof $ !== "undefined") { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $);
  }

})();

},{"./undo-redo":2,"./view-utilities":3}],2:[function(_dereq_,module,exports){
// Registers ur actions related to highlight
function highlightUR(cy, ur, viewUtilities) {
  function getStatus(eles) {
    eles = eles ? eles : cy.elements();
    return {
      highlighteds: eles.filter(".highlighted:visible"),
      highlighteds2: eles.filter(".highlighted2:visible"),
      highlighteds3: eles.filter(".highlighted3:visible"),
      highlighteds4: eles.filter(".highlighted4:visible"),
      notHighlighteds: eles.filter(":visible").not(".highlighted, .highlighted2, .highlighted3, .highlighted4")
    };
  }

  function createArgs(eles, option) {
    this.eles = eles;
    this.option = option;
  }

  function generalUndo(args) {
    var current = args.current;
    var highlighteds = viewUtilities.highlight({eles: args.highlighteds, option: "highlighted"});
    var highlighteds2 = viewUtilities.highlight({eles: args.highlighteds2, option: "highlighted2"});
    var highlighteds3 = viewUtilities.highlight({eles: args.highlighteds3, option: "highlighted3"});
    var highlighteds4 = viewUtilities.highlight({eles: args.highlighteds4, option: "highlighted4"});
    var notHighlighteds = viewUtilities.removeHighlights(args.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
      notHighlighteds: notHighlighteds,
      current: current
    };
  }

  function generalRedo(args) {
    var current = args.current;
    var highlighteds = viewUtilities.highlight({eles: args.current.highlighteds, option: "highlighted"});
    var highlighteds2 = viewUtilities.highlight({eles: args.current.highlighteds2, option: "highlighted2"});
    var highlighteds3 = viewUtilities.highlight({eles: args.current.highlighteds3, option: "highlighted3"});
    var highlighteds4 = viewUtilities.highlight({eles: args.current.highlighteds4, option: "highlighted4"});
    var notHighlighteds = viewUtilities.removeHighlights(args.current.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
      notHighlighteds: notHighlighteds,
      current: current
    };
  }

  function generateDoFunc(func) {
    return function (eles) {
      var res = getStatus();
      if (eles.firstTime)
        viewUtilities[func](eles);
      else
        generalRedo(eles);

      res.current = getStatus();

      return res;
    };
  }

  function urRemoveHighlights(args) {
    var res = getStatus();

    if (args.firstTime)
      viewUtilities.removeHighlights(eles);
    else
      generalRedo(args);

    res.current = getStatus();

    return res;
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
  ur.action("highlightNeighbours", generateDoFunc("highlightNeighbours"), generalUndo);
  ur.action("highlight", generateDoFunc("highlight"), generalUndo);
  //ur.action("unhighlight", generateDoFunc("unhighlight"), generalUndo);
  //ur.action("unhighlightNeighbors", generateDoFunc("unhighlightNeighbors"), generalUndo);
  //ur.action("unhighlightNeighbours", generateDoFunc("unhighlightNeighbours"), generalUndo);
  ur.action("removeHighlights", generateDoFunc("removeHighlights"), generalUndo);
}

// Registers ur actions related to hide/show
function hideShowUR(cy, ur, viewUtilities) {
  function urShow(eles) {
    return viewUtilities.show(eles);
  }

  function urHide(eles) {
    return viewUtilities.hide(eles);
  }

  ur.action("show", urShow, urHide);
  ur.action("hide", urHide, urShow);
}

module.exports = function (cy, ur, viewUtilities) {
  highlightUR(cy, ur, viewUtilities);
  hideShowUR(cy, ur, viewUtilities);
};

},{}],3:[function(_dereq_,module,exports){
var viewUtilities = function (cy, options) {

  // Set style for highlighted and unhighligthed eles
  cy
  .style()
  .selector("node.highlighted")
  .css(options.node.highlighted)
  .selector("node.highlighted:selected")
  .css(options.node.selected)
  .selector("node.highlighted2")
  .css(options.node.highlighted2)
  .selector("node.highlighted2:selected")
  .css(options.node.selected)
  .selector("node.highlighted3")
  .css(options.node.highlighted3)
  .selector("node.highlighted3:selected")
  .css(options.node.selected)
  .selector("node.highlighted4")
  .css(options.node.highlighted4)
  .selector("node.highlighted4:selected")
  .css(options.node.selected)
  .selector("edge.highlighted")
  .css(options.edge.highlighted)
  .selector("edge.highlighted:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted2")
  .css(options.edge.highlighted2)
  .selector("edge.highlighted2:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted3")
  .css(options.edge.highlighted3)
  .selector("edge.highlighted3:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted4")
  .css(options.edge.highlighted4)
  .selector("edge.highlighted4:selected")
  .css(options.edge.selected)
  .update();

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    switch(option){
      case "highlighted":
        eles.removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
      case "highlighted2":
        eles.removeClass("highlighted").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted2");
        eles.unselect();
        break;
      case "highlighted3":
        eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted4").addClass("highlighted3");
        eles.unselect();
        break;
      case "highlighted4":
        eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").addClass("highlighted4");
        eles.unselect();
        break;
      default:
        eles.removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
    }
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};

  // Section hide-show
  // hide given eles
  instance.hide = function (eles) {
    eles = eles.filter(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'hidden');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'none');
    }

    return eles;
  };

  // unhide given eles
  instance.show = function (eles) {
    eles = eles.not(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'visible');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'element');
    }

    return eles;
  };

  // Section highlight

  // Highlights eles & unhighlights others at first use.
  instance.highlight = function (args) {
    if (args.option == null)
    {
      var eles = args;
      var option = "";
    }
    else
    {
      var eles = args.eles;
      var option = args.option;
    }

    //var others = cy.elements().difference(eles.union(eles.ancestors()));

    //if (cy.$(".highlighted:visible").length == 0 && cy.$(".highlighted2:visible").length == 0 && cy.$(".highlighted3:visible").length == 0 && cy.$(".highlighted4:visible").length == 0)
      //this.unhighlight(others);

    highlight(eles, option); // Use the helper here

    return eles;
  };

  // Just unhighlights eles.
  //instance.unhighlight = function (eles) {
    //eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4");
  //};

  // Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
  instance.highlightNeighbors = function (args) {
    if (args.option == null)
    {
      var eles = args;
      var option = "";
    }
    else
    {
      var eles = args.eles;
      var option = args.option;
    }
    return this.highlight({eles: getWithNeighbors(eles), option: option});
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (args) {
    return this.highlightNeighbors(args);
  };

  // Just unhighlights eles and their neighbors.
  /*instance.unhighlightNeighbors = function (eles) {
    var allEles = getWithNeighbors(eles);

    return this.unhighlight(allEles);
  };

  // Aliases: this.unhighlightNeighbours()
  instance.unhighlightNeighbours = function (eles) {
    this.unhighlightNeighbors(eles);
  };*/

  // Remove highlights & unhighlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
      if (eles == null || eles.length == null)
        eles = cy.elements();
      return eles.removeClass("highlighted")
            .removeClass("highlighted2")
            .removeClass("highlighted3")
            .removeClass("highlighted4")
            .removeData("highlighted")
            .removeData("highlighted2")
            .removeData("highlighted3")
            .removeData("highlighted4")
            .unselect(); // TODO check if remove data is needed here
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    if (ele.is(".highlighted:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted1:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted2:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted3:visible") == true)
    {
      return true;
    }
    else
    {
      return false;
    }
  };

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles){
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if( diff_x >= 200 || diff_y >= 200){
      padding = 50;
    }
    else{
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x)/2 * cy.width() / 200) : ((200 - diff_y)/2 * cy.height() / 200);
    }

    cy.animate({
      fit: {
        eles: eles,
        padding: padding
      }
    }, {
      duration: options.zoomAnimationDuration
    });
    return eles;
  };

  //Marquee Zoom
  var tabStartHandler;
  var tabEndHandler;

  instance.enableMarqueeZoom = function(callback){

    var shiftKeyDown = false;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

    document.addEventListener('keydown', function(event){
      if(event.key == "Shift") {
        shiftKeyDown = true;
      }
    });
    document.addEventListener('keyup', function(event){
      if(event.key == "Shift") {
        shiftKeyDown = false;
      }
    });

    cy.one('tapstart', tabStartHandler = function(event){
      if( shiftKeyDown == true){
      rect_start_pos_x = event.position.x;
      rect_start_pos_y = event.position.y;
      rect_end_pos_x = undefined;
    }
    });
    cy.one('tapend', tabEndHandler = function(event){
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if( rect_start_pos_x == undefined || rect_end_pos_x == undefined){
        cy.autounselectify(false);
        if(callback){
          callback();
        }
        return;
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if(rect_start_pos_x > rect_end_pos_x){
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if(rect_start_pos_y > rect_end_pos_y){
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 200px if less than 100px
      if(rect_end_pos_x - rect_start_pos_x < 200){
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if(rect_end_pos_y - rect_start_pos_y < 200){
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if((rect_start_pos_x > cy.elements().boundingBox().x2)
        ||(rect_end_pos_x < cy.elements().boundingBox().x1)
        ||(rect_start_pos_y > cy.elements().boundingBox().y2)
        ||(rect_end_pos_y < cy.elements().boundingBox().y1)){
        cy.autounselectify(false);
        if(callback){
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min( cy.width()/ ( Math.abs(rect_end_pos_x- rect_start_pos_x)),
        cy.height() / Math.abs( rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy : {x: diff_x, y: diff_y},
        zoom : zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function(){
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function(){
    cy.off('tapstart', tabStartHandler );
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiO1xuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgJCkge1xuXG4gICAgaWYgKCFjeXRvc2NhcGUgfHwgISQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBub2RlOiB7XG4gICAgICAgIGhpZ2hsaWdodGVkOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMEI5QkNEJywgIC8vYmx1ZVxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlnaGxpZ2h0ZWQyOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMDRGMDZBJywgIC8vZ3JlZW5cbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNGNUU2NjMnLCAgIC8veWVsbG93XG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjQkYwNjAzJywgICAgLy9yZWRcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZDoge1xuICAgICAgICAgICdib3JkZXItY29sb3InOiAnYmxhY2snLFxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzLFxuICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ2xpZ2h0Z3JleSdcbiAgICAgICAgfVxuXG4gICAgICB9LFxuICAgICAgZWRnZToge1xuICAgICAgICBoaWdobGlnaHRlZDoge1xuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyMwQjlCQ0QnLCAgICAvL2JsdWVcbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjMDRGMDZBJywgICAvL2dyZWVuXG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQzOiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0Y1RTY2MycsICAgIC8veWVsbG93XG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0JGMDYwMycsICAgIC8vcmVkXG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0ZWQ6IHtcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICdibGFjaycsXG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNldFZpc2liaWxpdHlPbkhpZGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHNldCB2aXNpYmlsaXR5IG9uIGhpZGUvc2hvd1xuICAgICAgc2V0RGlzcGxheU9uSGlkZTogdHJ1ZSwgLy8gd2hldGhlciB0byBzZXQgZGlzcGxheSBvbiBoaWRlL3Nob3dcbiAgICAgIHpvb21BbmltYXRpb25EdXJhdGlvbjogMTUwMCwgLy9kZWZhdWx0IGR1cmF0aW9uIGZvciB6b29tIGFuaW1hdGlvbiBzcGVlZFxuICAgICAgbmVpZ2hib3I6IGZ1bmN0aW9uKG5vZGUpeyAvLyByZXR1cm4gZGVzaXJlZCBuZWlnaGJvcnMgb2YgdGFwaGVsZCBub2RlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBuZWlnaGJvclNlbGVjdFRpbWU6IDUwMCAvL21zLCB0aW1lIHRvIHRhcGhvbGQgdG8gc2VsZWN0IGRlc2lyZWQgbmVpZ2hib3JzXG4gICAgfTtcblxuXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xuICAgIHZhciB2aWV3VXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdmlldy11dGlsaXRpZXNcIik7XG5cbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICB2YXIgY3kgPSB0aGlzO1xuXG4gICAgICAvLyBJZiAnZ2V0JyBpcyBnaXZlbiBhcyB0aGUgcGFyYW0gdGhlbiByZXR1cm4gdGhlIGV4dGVuc2lvbiBpbnN0YW5jZVxuICAgICAgaWYgKG9wdHMgPT09ICdnZXQnKSB7XG4gICAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgb3B0cyk7XG5cbiAgICAgIGZ1bmN0aW9uIGdldFNjcmF0Y2goZWxlT3JDeSkge1xuICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XG4gICAgICAgICAgZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpO1xuICAgICAgfVxuXG5cbiAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIHZpZXcgdXRpbGl0aWVzIGluc3RhbmNlXG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHZpZXdVdGlsaXRpZXMoY3ksIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChjeS51bmRvUmVkbykge1xuICAgICAgICAgIHZhciB1ciA9IGN5LnVuZG9SZWRvKG51bGwsIHRydWUpO1xuICAgICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHRoZSBpbnN0YW5jZSBvbiB0aGUgc2NyYXRjaCBwYWRcbiAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2UgPSBpbnN0YW5jZTtcblxuICAgICAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvL1NlbGVjdCB0aGUgZGVzaXJlZCBuZWlnaGJvcnMgYWZ0ZXIgdGFwaG9sZC1hbmQtZnJlZVxuICAgICAgICBjeS5vbigndGFwaG9sZCcsICdub2RlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XG4gICAgICAgICAgdmFyIHRhcGhlbGQgPSBmYWxzZTtcbiAgICAgICAgICB2YXIgbmVpZ2hib3Job29kO1xuICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoc2hpZnRLZXlEb3duKXtcbiAgICAgICAgICAgICAgY3kuZWxlbWVudHMoKS51bnNlbGVjdCgpO1xuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2QgPSBvcHRpb25zLm5laWdoYm9yKHRhcmdldCk7XG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgdGFyZ2V0LmxvY2soKTtcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgb3B0aW9ucy5uZWlnaGJvclNlbGVjdFRpbWUgLSA1MDApO1xuICAgICAgICAgIGN5Lm9uKCdmcmVlJywgJ25vZGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRhcmdldFRhcGhlbGQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0VGFwaGVsZCAmJiB0YXBoZWxkID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XG4gICAgICAgICAgICAgIHRhcmdldC51bmxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0YXJnZXREcmFnZ2VkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldERyYWdnZWQgJiYgdGFwaGVsZCA9PT0gZmFsc2Upe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJldHVybiB0aGUgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXG4gICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XG4gICAgfSk7XG5cbiAgfTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxuICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAkICE9PSBcInVuZGVmaW5lZFwiKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXG4gICAgcmVnaXN0ZXIoY3l0b3NjYXBlLCAkKTtcbiAgfVxuXG59KSgpO1xuIiwiLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWdobGlnaHRcbmZ1bmN0aW9uIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xuICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xuICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcbiAgICAgIGhpZ2hsaWdodGVkczI6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpLFxuICAgICAgaGlnaGxpZ2h0ZWRzMzogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQzOnZpc2libGVcIiksXG4gICAgICBoaWdobGlnaHRlZHM0OiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDQ6dmlzaWJsZVwiKSxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3QoXCIuaGlnaGxpZ2h0ZWQsIC5oaWdobGlnaHRlZDIsIC5oaWdobGlnaHRlZDMsIC5oaWdobGlnaHRlZDRcIilcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQXJncyhlbGVzLCBvcHRpb24pIHtcbiAgICB0aGlzLmVsZXMgPSBlbGVzO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMsIG9wdGlvbjogXCJoaWdobGlnaHRlZFwifSk7XG4gICAgdmFyIGhpZ2hsaWdodGVkczIgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczMsIG9wdGlvbjogXCJoaWdobGlnaHRlZDNcIn0pO1xuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzNCwgb3B0aW9uOiBcImhpZ2hsaWdodGVkNFwifSk7XG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLm5vdEhpZ2hsaWdodGVkcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXG4gICAgICBoaWdobGlnaHRlZHMyOiBoaWdobGlnaHRlZHMyLFxuICAgICAgaGlnaGxpZ2h0ZWRzMzogaGlnaGxpZ2h0ZWRzMyxcbiAgICAgIGhpZ2hsaWdodGVkczQ6IGhpZ2hsaWdodGVkczQsXG4gICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhbFJlZG8oYXJncykge1xuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcywgb3B0aW9uOiBcImhpZ2hsaWdodGVkXCJ9KTtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMiA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzMiwgb3B0aW9uOiBcImhpZ2hsaWdodGVkMlwifSk7XG4gICAgdmFyIGhpZ2hsaWdodGVkczMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkczMsIG9wdGlvbjogXCJoaWdobGlnaHRlZDNcIn0pO1xuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHM0LCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQ0XCJ9KTtcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3MuY3VycmVudC5ub3RIaWdobGlnaHRlZHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxuICAgICAgaGlnaGxpZ2h0ZWRzMjogaGlnaGxpZ2h0ZWRzMixcbiAgICAgIGhpZ2hsaWdodGVkczM6IGhpZ2hsaWdodGVkczMsXG4gICAgICBoaWdobGlnaHRlZHM0OiBoaWdobGlnaHRlZHM0LFxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXG4gICAgICBjdXJyZW50OiBjdXJyZW50XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcbiAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShlbGVzKTtcbiAgICAgIGVsc2VcbiAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XG5cbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XG4gICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xuXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxuICAgICAgdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGVsZXMpO1xuICAgIGVsc2VcbiAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xuXG4gICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XG4gIC8vdXIuYWN0aW9uKFwidW5oaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xuICAvL3VyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgLy91ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcbn1cblxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcbmZ1bmN0aW9uIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuaGlkZShlbGVzKTtcbiAgfVxuXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcbn07XG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xuXG4gIC8vIFNldCBzdHlsZSBmb3IgaGlnaGxpZ2h0ZWQgYW5kIHVuaGlnaGxpZ3RoZWQgZWxlc1xuICBjeVxuICAuc3R5bGUoKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkMlwiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDIpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkM1wiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDMpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQzOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkNFwiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQ0OnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkMlwiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDIpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkM1wiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDMpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQzOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkNFwiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ0OnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAudXBkYXRlKCk7XG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxuICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcywgb3B0aW9uKSB7XG4gICAgc3dpdGNoKG9wdGlvbil7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWRcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImhpZ2hsaWdodGVkMlwiOlxuICAgICAgICBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDJcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQzXCI6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkM1wiKTtcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDRcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpO1xuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xuICB9XG4gIC8vIHRoZSBpbnN0YW5jZSB0byBiZSByZXR1cm5lZFxuICB2YXIgaW5zdGFuY2UgPSB7fTtcblxuICAvLyBTZWN0aW9uIGhpZGUtc2hvd1xuICAvLyBoaWRlIGdpdmVuIGVsZXNcbiAgaW5zdGFuY2UuaGlkZSA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XG4gICAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcblxuICAgIGVsZXMudW5zZWxlY3QoKTtcblxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvLyB1bmhpZGUgZ2l2ZW4gZWxlc1xuICBpbnN0YW5jZS5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xuXG4gICAgZWxlcy51bnNlbGVjdCgpO1xuXG4gICAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxuXG4gIC8vIEhpZ2hsaWdodHMgZWxlcyAmIHVuaGlnaGxpZ2h0cyBvdGhlcnMgYXQgZmlyc3QgdXNlLlxuICBpbnN0YW5jZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIGlmIChhcmdzLm9wdGlvbiA9PSBudWxsKVxuICAgIHtcbiAgICAgIHZhciBlbGVzID0gYXJncztcbiAgICAgIHZhciBvcHRpb24gPSBcIlwiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIGVsZXMgPSBhcmdzLmVsZXM7XG4gICAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XG4gICAgfVxuXG4gICAgLy92YXIgb3RoZXJzID0gY3kuZWxlbWVudHMoKS5kaWZmZXJlbmNlKGVsZXMudW5pb24oZWxlcy5hbmNlc3RvcnMoKSkpO1xuXG4gICAgLy9pZiAoY3kuJChcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwICYmIGN5LiQoXCIuaGlnaGxpZ2h0ZWQyOnZpc2libGVcIikubGVuZ3RoID09IDAgJiYgY3kuJChcIi5oaWdobGlnaHRlZDM6dmlzaWJsZVwiKS5sZW5ndGggPT0gMCAmJiBjeS4kKFwiLmhpZ2hsaWdodGVkNDp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwKVxuICAgICAgLy90aGlzLnVuaGlnaGxpZ2h0KG90aGVycyk7XG5cbiAgICBoaWdobGlnaHQoZWxlcywgb3B0aW9uKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxuXG4gICAgcmV0dXJuIGVsZXM7XG4gIH07XG5cbiAgLy8gSnVzdCB1bmhpZ2hsaWdodHMgZWxlcy5cbiAgLy9pbnN0YW5jZS51bmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgLy9lbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIik7XG4gIC8vfTtcblxuICAvLyBIaWdobGlnaHRzIGVsZXMnIG5laWdoYm9yaG9vZCAmIHVuaGlnaGxpZ2h0cyBvdGhlcnMnIG5laWdoYm9yaG9vZCBhdCBmaXJzdCB1c2UuXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpXG4gICAge1xuICAgICAgdmFyIGVsZXMgPSBhcmdzO1xuICAgICAgdmFyIG9wdGlvbiA9IFwiXCI7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgZWxlcyA9IGFyZ3MuZWxlcztcbiAgICAgIHZhciBvcHRpb24gPSBhcmdzLm9wdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0KHtlbGVzOiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpLCBvcHRpb246IG9wdGlvbn0pO1xuICB9O1xuXG4gIC8vIEFsaWFzZXM6IHRoaXMuaGlnaGxpZ2h0TmVpZ2hib3VycygpXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm91cnMgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodE5laWdoYm9ycyhhcmdzKTtcbiAgfTtcblxuICAvLyBKdXN0IHVuaGlnaGxpZ2h0cyBlbGVzIGFuZCB0aGVpciBuZWlnaGJvcnMuXG4gIC8qaW5zdGFuY2UudW5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcblxuICAgIHJldHVybiB0aGlzLnVuaGlnaGxpZ2h0KGFsbEVsZXMpO1xuICB9O1xuXG4gIC8vIEFsaWFzZXM6IHRoaXMudW5oaWdobGlnaHROZWlnaGJvdXJzKClcbiAgaW5zdGFuY2UudW5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICB0aGlzLnVuaGlnaGxpZ2h0TmVpZ2hib3JzKGVsZXMpO1xuICB9OyovXG5cbiAgLy8gUmVtb3ZlIGhpZ2hsaWdodHMgJiB1bmhpZ2hsaWdodHMgZnJvbSBlbGVzLlxuICAvLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgICAgaWYgKGVsZXMgPT0gbnVsbCB8fCBlbGVzLmxlbmd0aCA9PSBudWxsKVxuICAgICAgICBlbGVzID0gY3kuZWxlbWVudHMoKTtcbiAgICAgIHJldHVybiBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIilcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQyXCIpXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkM1wiKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDRcIilcbiAgICAgICAgICAgIC51bnNlbGVjdCgpOyAvLyBUT0RPIGNoZWNrIGlmIHJlbW92ZSBkYXRhIGlzIG5lZWRlZCBoZXJlXG4gIH07XG5cbiAgLy8gSW5kaWNhdGVzIGlmIHRoZSBlbGUgaXMgaGlnaGxpZ2h0ZWRcbiAgaW5zdGFuY2UuaXNIaWdobGlnaHRlZCA9IGZ1bmN0aW9uIChlbGUpIHtcbiAgICBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikgPT0gdHJ1ZSlcbiAgICB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMTp2aXNpYmxlXCIpID09IHRydWUpXG4gICAge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVsZS5pcyhcIi5oaWdobGlnaHRlZDI6dmlzaWJsZVwiKSA9PSB0cnVlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQzOnZpc2libGVcIikgPT0gdHJ1ZSlcbiAgICB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgLy9ab29tIHNlbGVjdGVkIE5vZGVzXG4gIGluc3RhbmNlLnpvb21Ub1NlbGVjdGVkID0gZnVuY3Rpb24gKGVsZXMpe1xuICAgIHZhciBib3VuZGluZ0JveCA9IGVsZXMuYm91bmRpbmdCb3goKTtcbiAgICB2YXIgZGlmZl94ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueDEgLSBib3VuZGluZ0JveC54Mik7XG4gICAgdmFyIGRpZmZfeSA9IE1hdGguYWJzKGJvdW5kaW5nQm94LnkxIC0gYm91bmRpbmdCb3gueTIpO1xuICAgIHZhciBwYWRkaW5nO1xuICAgIGlmKCBkaWZmX3ggPj0gMjAwIHx8IGRpZmZfeSA+PSAyMDApe1xuICAgICAgcGFkZGluZyA9IDUwO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcGFkZGluZyA9IChjeS53aWR0aCgpIDwgY3kuaGVpZ2h0KCkpID9cbiAgICAgICAgKCgyMDAgLSBkaWZmX3gpLzIgKiBjeS53aWR0aCgpIC8gMjAwKSA6ICgoMjAwIC0gZGlmZl95KS8yICogY3kuaGVpZ2h0KCkgLyAyMDApO1xuICAgIH1cblxuICAgIGN5LmFuaW1hdGUoe1xuICAgICAgZml0OiB7XG4gICAgICAgIGVsZXM6IGVsZXMsXG4gICAgICAgIHBhZGRpbmc6IHBhZGRpbmdcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb25cbiAgICB9KTtcbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvL01hcnF1ZWUgWm9vbVxuICB2YXIgdGFiU3RhcnRIYW5kbGVyO1xuICB2YXIgdGFiRW5kSGFuZGxlcjtcblxuICBpbnN0YW5jZS5lbmFibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcblxuICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcbiAgICB2YXIgcmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSwgcmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195O1xuICAgIC8vTWFrZSB0aGUgY3kgdW5zZWxlY3RhYmxlXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjeS5vbmUoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgaWYoIHNoaWZ0S2V5RG93biA9PSB0cnVlKXtcbiAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICByZWN0X2VuZF9wb3NfeCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgfSk7XG4gICAgY3kub25lKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgcmVjdF9lbmRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgcmVjdF9lbmRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgLy9jaGVjayB3aGV0aGVyIGNvcm5lcnMgb2YgcmVjdGFuZ2xlIGlzIHVuZGVmaW5lZFxuICAgICAgLy9hYm9ydCBtYXJxdWVlIHpvb20gaWYgb25lIGNvcm5lciBpcyB1bmRlZmluZWRcbiAgICAgIGlmKCByZWN0X3N0YXJ0X3Bvc194ID09IHVuZGVmaW5lZCB8fCByZWN0X2VuZF9wb3NfeCA9PSB1bmRlZmluZWQpe1xuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xuICAgICAgICBpZihjYWxsYmFjayl7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvL1Jlb2RlciByZWN0YW5nbGUgcG9zaXRpb25zXG4gICAgICAvL1RvcCBsZWZ0IG9mIHRoZSByZWN0YW5nbGUgKHJlY3Rfc3RhcnRfcG9zX3gsIHJlY3Rfc3RhcnRfcG9zX3kpXG4gICAgICAvL3JpZ2h0IGJvdHRvbSBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3kpXG4gICAgICBpZihyZWN0X3N0YXJ0X3Bvc194ID4gcmVjdF9lbmRfcG9zX3gpe1xuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3g7XG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSByZWN0X2VuZF9wb3NfeDtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggPSB0ZW1wO1xuICAgICAgfVxuICAgICAgaWYocmVjdF9zdGFydF9wb3NfeSA+IHJlY3RfZW5kX3Bvc195KXtcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc195O1xuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gcmVjdF9lbmRfcG9zX3k7XG4gICAgICAgIHJlY3RfZW5kX3Bvc195ID0gdGVtcDtcbiAgICAgIH1cblxuICAgICAgLy9FeHRlbmQgc2lkZXMgb2Ygc2VsZWN0ZWQgcmVjdGFuZ2xlIHRvIDIwMHB4IGlmIGxlc3MgdGhhbiAxMDBweFxuICAgICAgaWYocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194IDwgMjAwKXtcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3gpKSAvIDI7XG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggLT0gZXh0ZW5kUHg7XG4gICAgICAgIHJlY3RfZW5kX3Bvc194ICs9IGV4dGVuZFB4O1xuICAgICAgfVxuICAgICAgaWYocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195IDwgMjAwKXtcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKSAvIDI7XG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgLT0gZXh0ZW5kUHg7XG4gICAgICAgIHJlY3RfZW5kX3Bvc195ICs9IGV4dGVuZFB4O1xuICAgICAgfVxuXG4gICAgICAvL0NoZWNrIHdoZXRoZXIgcmVjdGFuZ2xlIGludGVyc2VjdHMgd2l0aCBib3VuZGluZyBib3ggb2YgdGhlIGdyYXBoXG4gICAgICAvL2lmIG5vdCBhYm9ydCBtYXJxdWVlIHpvb21cbiAgICAgIGlmKChyZWN0X3N0YXJ0X3Bvc194ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngyKVxuICAgICAgICB8fChyZWN0X2VuZF9wb3NfeCA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MSlcbiAgICAgICAgfHwocmVjdF9zdGFydF9wb3NfeSA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MilcbiAgICAgICAgfHwocmVjdF9lbmRfcG9zX3kgPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTEpKXtcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcbiAgICAgICAgaWYoY2FsbGJhY2spe1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvL0NhbGN1bGF0ZSB6b29tIGxldmVsXG4gICAgICB2YXIgem9vbUxldmVsID0gTWF0aC5taW4oIGN5LndpZHRoKCkvICggTWF0aC5hYnMocmVjdF9lbmRfcG9zX3gtIHJlY3Rfc3RhcnRfcG9zX3gpKSxcbiAgICAgICAgY3kuaGVpZ2h0KCkgLyBNYXRoLmFicyggcmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSk7XG5cbiAgICAgIHZhciBkaWZmX3ggPSBjeS53aWR0aCgpIC8gMiAtIChjeS5wYW4oKS54ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3ggKyByZWN0X2VuZF9wb3NfeCkgLyAyKTtcbiAgICAgIHZhciBkaWZmX3kgPSBjeS5oZWlnaHQoKSAvIDIgLSAoY3kucGFuKCkueSArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc195ICsgcmVjdF9lbmRfcG9zX3kpIC8gMik7XG5cbiAgICAgIGN5LmFuaW1hdGUoe1xuICAgICAgICBwYW5CeSA6IHt4OiBkaWZmX3gsIHk6IGRpZmZfeX0sXG4gICAgICAgIHpvb20gOiB6b29tTGV2ZWwsXG4gICAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbigpe1xuICAgIGN5Lm9mZigndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgKTtcbiAgICBjeS5vZmYoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIpO1xuICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XG4gIH07XG5cbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxuICByZXR1cm4gaW5zdGFuY2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZpZXdVdGlsaXRpZXM7XG4iXX0=
