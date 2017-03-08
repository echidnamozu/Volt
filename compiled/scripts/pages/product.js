
define('shim!vendor/jquery.tools.dateinput[jquery=jQuery]>jQuery',['jquery'], function(jQuery) { 

/**
 * @license                                     
 * jQuery Tools @VERSION Dateinput - <input type="date" /> for humans
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/form/dateinput/
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
(function ($, undefined) {

    /* TODO: 
		 preserve today highlighted
	*/

    $.tools = $.tools || { version: '@VERSION' };

    var instances = [],
		formatters = {},
		 tool,

		 // h=72, j=74, k=75, l=76, down=40, left=37, up=38, right=39
		 KEYS = [75, 76, 38, 39, 74, 72, 40, 37],
		 LABELS = {};

    tool = $.tools.dateinput = {

        conf: {
            format: 'mm/dd/yy',
            formatter: 'default',
            selectors: false,
            yearRange: [-5, 5],
            lang: 'en',
            offset: [0, 0],
            speed: 0,
            firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
            min: undefined,
            max: undefined,
            trigger: 0,
            toggle: 0,
            editable: 0,

            css: {

                prefix: 'cal',
                input: 'date',

                // ids
                root: 0,
                head: 0,
                title: 0,
                prev: 0,
                next: 0,
                month: 0,
                year: 0,
                days: 0,

                body: 0,
                weeks: 0,
                today: 0,
                current: 0,

                // classnames
                week: 0,
                off: 0,
                sunday: 0,
                focus: 0,
                disabled: 0,
                trigger: 0
            }
        },

        addFormatter: function (name, fn) {
            formatters[name] = fn;
        },

        localize: function (language, labels) {
            $.each(labels, function (key, val) {
                labels[key] = val.split(",");
            });
            LABELS[language] = labels;
        }

    };

    tool.localize("en", {
        months: 'January,February,March,April,May,June,July,August,September,October,November,December',
        shortMonths: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
        days: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        shortDays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
    });


    //{{{ private functions


    // @return amount of days in certain month
    function dayAm(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function zeropad(val, len) {
        val = '' + val;
        len = len || 2;
        while (val.length < len) { val = "0" + val; }
        return val;
    }

    // thanks: http://stevenlevithan.com/assets/misc/date.format.js 
    var tmpTag = $("<a/>");

    function format(formatter, date, text, lang) {
        var d = date.getDate(),
              D = date.getDay(),
              m = date.getMonth(),
              y = date.getFullYear(),

              flags = {
                  d: d,
                  dd: zeropad(d),
                  ddd: LABELS[lang].shortDays[D],
                  dddd: LABELS[lang].days[D],
                  m: m + 1,
                  mm: zeropad(m + 1),
                  mmm: LABELS[lang].shortMonths[m],
                  mmmm: LABELS[lang].months[m],
                  yy: String(y).slice(2),
                  yyyy: y
              };

        var ret = formatters[formatter](text, date, flags, lang);

        // a small trick to handle special characters
        return tmpTag.html(ret).html();

    }

    tool.addFormatter('default', function (text, date, flags, lang) {
        return text.replace(/d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*'/g, function ($0) {
            return $0 in flags ? flags[$0] : $0;
        });
    });

    tool.addFormatter('prefixed', function (text, date, flags, lang) {
        return text.replace(/%(d{1,4}|m{1,4}|yy(?:yy)?|"[^"]*"|'[^']*')/g, function ($0, $1) {
            return $1 in flags ? flags[$1] : $0;
        });
    });

    function integer(val) {
        return parseInt(val, 10);
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
			d1.getMonth() == d2.getMonth() &&
			d1.getDate() == d2.getDate();
    }

    function parseDate(val) {

        if (val === undefined) { return; }
        if (val.constructor == Date) { return val; }

        if (typeof val == 'string') {

            // rfc3339?
            var els = val.split("-");
            if (els.length == 3) {
                return new Date(integer(els[0]), integer(els[1]) - 1, integer(els[2]));
            }

            // invalid offset
            if (!(/^-?\d+$/).test(val)) { return; }

            // convert to integer
            val = integer(val);
        }

        var date = new Date;
        date.setDate(date.getDate() + val);
        return date;
    }

    //}}}


    function Dateinput(input, conf) {

        // variables
        var self = this,
			 now = new Date,
			 yearNow = now.getFullYear(),
			 css = conf.css,
			 labels = LABELS[conf.lang],
			 root = $("#" + css.root),
			 title = root.find("#" + css.title),
			 trigger,
			 pm, nm,
			 currYear, currMonth, currDay,
			 value = input.attr("data-value") || conf.value || input.val(),
			 min = input.attr("min") || conf.min,
			 max = input.attr("max") || conf.max,
			 opened,
			 original;

        // zero min is not undefined 	 
        if (min === 0) { min = "0"; }

        // use sane values for value, min & max		
        value = parseDate(value) || now;

        min = parseDate(min || new Date(yearNow + conf.yearRange[0], 1, 1));
        max = parseDate(max || new Date(yearNow + conf.yearRange[1] + 1, 1, -1));


        // check that language exists
        if (!labels) { throw "Dateinput: invalid language: " + conf.lang; }

        // Replace built-in date input: NOTE: input.attr("type", "text") throws exception by the browser
        if (input.attr("type") == 'date') {
            var original = input.clone(),
          def = original.wrap("<div/>").parent().html(),
          clone = $(def.replace(/type/i, "type=text data-orig-type"));

            if (conf.value) clone.val(conf.value);   // jquery 1.6.2 val(undefined) will clear val()

            input.replaceWith(clone);
            input = clone;
        }

        input.addClass(css.input);

        var fire = input.add(self);

        // construct layout
        if (!root.length) {

            // root
            root = $('<div><div><a/><div/><a/></div><div><div/><div/></div></div>')
				.hide().css({ position: 'absolute' }).attr("id", css.root);

            // elements
            root.children()
				.eq(0).attr("id", css.head).end()
				.eq(1).attr("id", css.body).children()
					.eq(0).attr("id", css.days).end()
					.eq(1).attr("id", css.weeks).end().end().end()
				.find("a").eq(0).attr("id", css.prev).end().eq(1).attr("id", css.next);

            // title
            title = root.find("#" + css.head).find("div").attr("id", css.title);

            // year & month selectors
            if (conf.selectors) {
                var monthSelector = $("<select/>").attr("id", css.month),
					 yearSelector = $("<select/>").attr("id", css.year);
                title.html(monthSelector.add(yearSelector));
            }

            // day titles
            var days = root.find("#" + css.days);

            // days of the week
            for (var d = 0; d < 7; d++) {
                days.append($("<span/>").text(labels.shortDays[(d + conf.firstDay) % 7]));
            }

            $("body").append(root);
        }


        // trigger icon
        if (conf.trigger) {
            trigger = $("<a/>").attr("href", "#").addClass(css.trigger).click(function (e) {
                conf.toggle ? self.toggle() : self.show();
                return e.preventDefault();
            }).insertAfter(input);
        }


        // layout elements
        var weeks = root.find("#" + css.weeks);
        yearSelector = root.find("#" + css.year);
        monthSelector = root.find("#" + css.month);


        //{{{ pick

        function select(date, conf, e) {

            // current value
            value = date;
            currYear = date.getFullYear();
            currMonth = date.getMonth();
            currDay = date.getDate();

            e || (e = $.Event("api"));

            // focus the input after selection (doesn't work in IE)
            if (e.type == "click" && $.support.changeBubbles) {
                input.focus();
            }

            // beforeChange
            e.type = "beforeChange";

            fire.trigger(e, [date]);
            if (e.isDefaultPrevented()) { return; }

            // formatting			
            input.val(format(conf.formatter, date, conf.format, conf.lang));

            // change
            e.type = "change";
            fire.trigger(e);

            // store value into input
            input.data("date", date);

            self.hide(e);
        }
        //}}}


        //{{{ onShow

        function onShow(ev) {

            ev.type = "onShow";
            fire.trigger(ev);

            $(document).on("keydown.d", function (e) {

                if (e.ctrlKey) { return true; }
                var key = e.keyCode;

                // backspace or delete clears the value
                if (key == 8 || key == 46) {
                    input.val("");
                    return self.hide(e);
                }

                // esc or tab key exits
                if (key == 27 || key == 9) { return self.hide(e); }

                if ($(KEYS).index(key) >= 0) {

                    if (!opened) {
                        self.show(e);
                        return e.preventDefault();
                    }

                    var days = $("#" + css.weeks + " a"),
						 el = $("." + css.focus),
						 index = days.index(el);

                    el.removeClass(css.focus);

                    if (key == 74 || key == 40) { index += 7; }
                    else if (key == 75 || key == 38) { index -= 7; }
                    else if (key == 76 || key == 39) { index += 1; }
                    else if (key == 72 || key == 37) { index -= 1; }


                    if (index > 41) {
                        self.addMonth();
                        el = $("#" + css.weeks + " a:eq(" + (index - 42) + ")");
                    } else if (index < 0) {
                        self.addMonth(-1);
                        el = $("#" + css.weeks + " a:eq(" + (index + 42) + ")");
                    } else {
                        el = days.eq(index);
                    }

                    el.addClass(css.focus);
                    return e.preventDefault();

                }

                // pageUp / pageDown
                if (key == 34) { return self.addMonth(); }
                if (key == 33) { return self.addMonth(-1); }

                // home
                if (key == 36) { return self.today(); }

                // enter
                if (key == 13) {
                    if (!$(e.target).is("select")) {
                        $("." + css.focus).click();
                    }
                }

                return $([16, 17, 18, 9]).index(key) >= 0;
            });


            // click outside dateinput
            $(document).on("click.d", function (e) {
                var el = e.target;

                if (!$(el).parents("#" + css.root).length && el != input[0] && (!trigger || el != trigger[0])) {
                    self.hide(e);
                }

            });
        }
        //}}}


        $.extend(self, {


            /**
			*   @public
			*   Show the calendar
			*/
            show: function (e) {

                if (input.attr("readonly") || input.attr("disabled") || opened) { return; }

                // onBeforeShow
                e = e || $.Event();
                e.type = "onBeforeShow";
                fire.trigger(e);
                if (e.isDefaultPrevented()) { return; }

                $.each(instances, function () {
                    this.hide();
                });

                opened = true;

                // month selector
                monthSelector.off("change").change(function () {
                    self.setValue(integer(yearSelector.val()), integer($(this).val()));
                });

                // year selector
                yearSelector.off("change").change(function () {
                    self.setValue(integer($(this).val()), integer(monthSelector.val()));
                });

                // prev / next month
                pm = root.find("#" + css.prev).off("click").click(function (e) {
                    if (!pm.hasClass(css.disabled)) {
                        self.addMonth(-1);
                    }
                    return false;
                });

                nm = root.find("#" + css.next).off("click").click(function (e) {
                    if (!nm.hasClass(css.disabled)) {
                        self.addMonth();
                    }
                    return false;
                });

                // set date
                self.setValue(value);

                // show calendar
                var pos = input.offset();

                // iPad position fix
                if (/iPad/i.test(navigator.userAgent)) {
                    pos.top -= $(window).scrollTop();
                }

                root.css({
                    top: pos.top + input.outerHeight(true) + conf.offset[0],
                    left: pos.left + conf.offset[1]
                });

                if (conf.speed) {
                    root.show(conf.speed, function () {
                        onShow(e);
                    });
                } else {
                    root.show();
                    onShow(e);
                }

                return self;
            },

            /**
            *   @public
            *
            *   Set the value of the dateinput
            */
            setValue: function (year, month, day) {

                var date = integer(month) >= -1 ? new Date(integer(year), integer(month), integer(day == undefined || isNaN(day) ? 1 : day)) :
					year || value;

                if (date < min) { date = min; }
                else if (date > max) { date = max; }

                // date given as ISO string
                if (typeof year == 'string') { date = parseDate(year); }

                year = date.getFullYear();
                month = date.getMonth();
                day = date.getDate();


                // roll year & month
                if (month == -1) {
                    month = 11;
                    year--;
                } else if (month == 12) {
                    month = 0;
                    year++;
                }

                if (!opened) {
                    select(date, conf);
                    return self;
                }

                currMonth = month;
                currYear = year;
                currDay = day;

                // variables
                var tmp = new Date(year, month, 1 - conf.firstDay), begin = tmp.getDay(),
					 days = dayAm(year, month),
					 prevDays = dayAm(year, month - 1),
					 week;

                // selectors
                if (conf.selectors) {

                    // month selector
                    monthSelector.empty();
                    $.each(labels.months, function (i, m) {
                        if (min < new Date(year, i + 1, 1) && max > new Date(year, i, 0)) {
                            monthSelector.append($("<option/>").html(m).attr("value", i));
                        }
                    });

                    // year selector
                    yearSelector.empty();
                    var yearNow = now.getFullYear();

                    for (var i = yearNow + conf.yearRange[0]; i < yearNow + conf.yearRange[1]; i++) {
                        if (min < new Date(i + 1, 0, 1) && max > new Date(i, 0, 0)) {
                            yearSelector.append($("<option/>").text(i));
                        }
                    }

                    monthSelector.val(month);
                    yearSelector.val(year);

                    // title
                } else {
                    title.html(labels.months[month] + " " + year);
                }

                // populate weeks
                weeks.empty();
                pm.add(nm).removeClass(css.disabled);

                // !begin === "sunday"
                for (var j = !begin ? -7 : 0, a, num; j < (!begin ? 35 : 42) ; j++) {

                    a = $("<a/>");

                    if (j % 7 === 0) {
                        week = $("<div/>").addClass(css.week);
                        weeks.append(week);
                    }

                    if (j < begin) {
                        a.addClass(css.off);
                        num = prevDays - begin + j + 1;
                        date = new Date(year, month - 1, num);

                    } else if (j >= begin + days) {
                        a.addClass(css.off);
                        num = j - days - begin + 1;
                        date = new Date(year, month + 1, num);

                    } else {
                        num = j - begin + 1;
                        date = new Date(year, month, num);

                        // current date
                        if (isSameDay(value, date)) {
                            a.attr("id", css.current).addClass(css.focus);

                            // today
                        } else if (isSameDay(now, date)) {
                            a.attr("id", css.today);
                        }
                    }

                    // disabled
                    if (min && date < min) {
                        a.add(pm).addClass(css.disabled);
                    }

                    if (max && date > max) {
                        a.add(nm).addClass(css.disabled);
                    }

                    a.attr("href", "#" + num).text(num).data("date", date);

                    week.append(a);
                }

                // date picking					
                weeks.find("a").click(function (e) {
                    var el = $(this);
                    if (!el.hasClass(css.disabled)) {
                        $("#" + css.current).removeAttr("id");
                        el.attr("id", css.current);
                        select(el.data("date"), conf, e);
                    }
                    return false;
                });

                // sunday
                if (css.sunday) {
                    weeks.find("." + css.week).each(function () {
                        var beg = conf.firstDay ? 7 - conf.firstDay : 0;
                        $(this).children().slice(beg, beg + 1).addClass(css.sunday);
                    });
                }

                return self;
            },
            //}}}

            setMin: function (val, fit) {
                min = parseDate(val);
                if (fit && value < min) { self.setValue(min); }
                return self;
            },

            setMax: function (val, fit) {
                max = parseDate(val);
                if (fit && value > max) { self.setValue(max); }
                return self;
            },

            today: function () {
                return self.setValue(now);
            },

            addDay: function (amount) {
                return this.setValue(currYear, currMonth, currDay + (amount || 1));
            },

            addMonth: function (amount) {
                var targetMonth = currMonth + (amount || 1),
              daysInTargetMonth = dayAm(currYear, targetMonth),
              targetDay = currDay <= daysInTargetMonth ? currDay : daysInTargetMonth;

                return this.setValue(currYear, targetMonth, targetDay);
            },

            addYear: function (amount) {
                return this.setValue(currYear + (amount || 1), currMonth, currDay);
            },

            destroy: function () {
                input.add(document).off("click.d keydown.d");
                root.add(trigger).remove();
                input.removeData("dateinput").removeClass(css.input);
                if (original) { input.replaceWith(original); }
            },

            hide: function (e) {

                if (opened) {

                    // onHide 
                    e = $.Event();
                    e.type = "onHide";
                    fire.trigger(e);

                    // cancelled ?
                    if (e.isDefaultPrevented()) { return; }

                    $(document).off("click.d keydown.d");

                    // do the hide
                    root.hide();
                    opened = false;
                }

                return self;
            },

            toggle: function () {
                return self.isOpen() ? self.hide() : self.show();
            },

            getConf: function () {
                return conf;
            },

            getInput: function () {
                return input;
            },

            getCalendar: function () {
                return root;
            },

            getValue: function (dateFormat) {
                return dateFormat ? format(conf.formatter, value, dateFormat, conf.lang) : value;
            },

            isOpen: function () {
                return opened;
            }

        });

        // callbacks	
        $.each(['onBeforeShow', 'onShow', 'change', 'onHide'], function (i, name) {

            // configuration
            if ($.isFunction(conf[name])) {
                $(self).on(name, conf[name]);
            }

            // API methods				
            self[name] = function (fn) {
                if (fn) { $(self).on(name, fn); }
                return self;
            };
        });

        if (!conf.editable) {

            // show dateinput & assign keyboard shortcuts
            input.on("focus.d click.d", self.show).keydown(function (e) {

                var key = e.keyCode;

                // open dateinput with navigation keyw
                if (!opened && $(KEYS).index(key) >= 0) {
                    self.show(e);
                    return e.preventDefault();

                    // clear value on backspace or delete
                } else if (key == 8 || key == 46) {
                    input.val("");
                }

                // allow tab
                return e.shiftKey || e.ctrlKey || e.altKey || key == 9 ? true : e.preventDefault();

            });
        }

        // initial value 		
        if (parseDate(input.val())) {
            select(value, conf);
        }

    }

    $.expr[':'].date = function (el) {
        var type = el.getAttribute("type");
        return type && type == 'date' || !!$(el).data("dateinput");
    };


    $.fn.dateinput = function (conf) {

        // already instantiated
        if (this.data("dateinput")) { return this; }

        // configuration
        conf = $.extend(true, {}, tool.conf, conf);

        // CSS prefix
        $.each(conf.css, function (key, val) {
            if (!val && key != 'prefix') {
                conf.css[key] = (conf.css.prefix || '') + (val || key);
            }
        });

        var els;

        this.each(function () {
            var el = new Dateinput($(this), conf);
            instances.push(el);
            var input = el.getInput().data("dateinput", el);
            els = els ? els.add(input) : input;
        });

        return els ? els : this;
    };


})(jQuery);

 ; 

return jQuery; 

});


//@ sourceURL=/vendor/jquery.tools.dateinput.js

;
/**
 * Extends the third-party jQuery Tools DatePicker widget to be internationalized
 * with Mozu text labels.
 */

define('modules/jquery-dateinput-localized',['shim!vendor/jquery.tools.dateinput[jquery=jQuery]>jQuery', 'underscore', 'hyprlive'], function ($, _, Hypr) {
    var months = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
        days = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(',');

    var locale = (navigator.language || "en-US").split('-').shift();
    $.tools.dateinput.conf.locale = locale;
    $.tools.dateinput.localize(locale, {
        months: _.map(months, function (month) {
            return Hypr.getLabel(month.toLowerCase());
        }).join(','),
        shortMonths: _.map(months, function (month) {
            return Hypr.getLabel('short' + month);
        }).join(','),
        days: _.map(days, function (day) {
            return Hypr.getLabel(day.toLowerCase());
        }).join(','),
        shortDays: _.map(days, function (day) {
            return Hypr.getLabel('short' + day);
        }).join(',')
    });
});

define('shim!vendor/jquery.responsiveTabs[jquery=jQuery]',['jquery'], function(jQuery) { 

/*
 *  Project: jquery.responsiveTabs.js
 *  Description: A plugin that creates responsive tabs, optimized for all devices
 *  Author: Jelle Kralt (jelle@jellekralt.nl)
 *  Version: 1.4.3
 *  License: MIT
 */

;(function ( $, window, undefined ) {

    /** Default settings */
    var defaults = {
        active: null,
        event: 'click',
        disabled: [],
        collapsible: 'accordion',
        startCollapsed: false,
        rotate: false,
        setHash: false,
        animation: 'default',
        duration: 500,
        scrollToAccordion: false,
        activate: function(){},
        deactivate: function(){},
        load: function(){},
        activateState: function(){},
        classes: {
            stateDefault: 'r-tabs-state-default',
            stateActive: 'r-tabs-state-active',
            stateDisabled: 'r-tabs-state-disabled',
            stateExcluded: 'r-tabs-state-excluded',
            tab: 'r-tabs-tab',
            anchor: 'r-tabs-anchor',
            panel: 'r-tabs-panel',
            accordionTitle: 'r-tabs-accordion-title'
        }
    };

    /**
     * Responsive Tabs
     * @constructor
     * @param {object} element - The HTML element the validator should be bound to
     * @param {object} options - An option map
     */
    function ResponsiveTabs(element, options) {
        this.element = element; // Selected DOM element
        this.$element = $(element); // Selected jQuery element

        this.tabs = []; // Create tabs array
        this.state = ''; // Define the plugin state (tabs/accordion)
        this.rotateInterval = 0; // Define rotate interval
        this.$queue = $({});

        // Extend the defaults with the passed options
        this.options = $.extend( {}, defaults, options);

        this.init();
    }


    /**
     * This function initializes the tab plugin
     */
    ResponsiveTabs.prototype.init = function () {
        var _this = this;

        // Load all the elements
        this.tabs = this._loadElements();
        this._loadClasses();
        this._loadEvents();

        // Window resize bind to check state
        $(window).on('resize', function(e) {
            _this._setState(e);
        });

        // Hashchange event
        $(window).on('hashchange', function(e) {
            var tabRef = _this._getTabRefBySelector(window.location.hash);
            var oTab = _this._getTab(tabRef);

            // Check if a tab is found that matches the hash
            if(tabRef >= 0 && !oTab._ignoreHashChange && !oTab.disabled) {
                // If so, open the tab and auto close the current one
                _this._openTab(e, _this._getTab(tabRef), true);
            }
        });

        // Start rotate event if rotate option is defined
        if(this.options.rotate !== false) {
            this.startRotation();
        }

        // --------------------
        // Define plugin events
        //

        // Activate: this event is called when a tab is selected
        this.$element.bind('tabs-activate', function(e, oTab) {
            _this.options.activate.call(this, e, oTab);
        });
        // Deactivate: this event is called when a tab is closed
        this.$element.bind('tabs-deactivate', function(e, oTab) {
            _this.options.deactivate.call(this, e, oTab);
        });
        // Activate State: this event is called when the plugin switches states
        this.$element.bind('tabs-activate-state', function(e, state) {
            _this.options.activateState.call(this, e, state);
        });

        // Load: this event is called when the plugin has been loaded
        this.$element.bind('tabs-load', function(e) {
            var startTab;

            _this._setState(e); // Set state

            // Check if the panel should be collaped on load
            if(_this.options.startCollapsed !== true && !(_this.options.startCollapsed === 'accordion' && _this.state === 'accordion')) {

                startTab = _this._getStartTab();

                // Open the initial tab
                _this._openTab(e, startTab); // Open first tab

                // Call the callback function
                _this.options.load.call(this, e, startTab); // Call the load callback
            }
        });
        // Trigger loaded event
        this.$element.trigger('tabs-load');
    };
    
    //
    // PRIVATE FUNCTIONS
    //

    /**
     * This function loads the tab elements and stores them in an array
     * @returns {Array} Array of tab elements
     */
    ResponsiveTabs.prototype._loadElements = function() {
        var _this = this;
        var $ul = this.$element.children('ul');
        var tabs = [];
        var id = 0;

        // Add the classes to the basic html elements
        this.$element.addClass('r-tabs'); // Tab container
        $ul.addClass('r-tabs-nav'); // List container

        // Get tab buttons and store their data in an array
        $('li', $ul).each(function() {
            var $tab = $(this);
            var isExcluded = $tab.hasClass(_this.options.classes.stateExcluded);
            var $anchor, $panel, $accordionTab, $accordionAnchor, panelSelector;

            // Check if the tab should be excluded
            if(!isExcluded) {

                $anchor = $('a', $tab);
                panelSelector = $anchor.attr('href');
                $panel = $(panelSelector);
                $accordionTab = $('<div></div>').insertBefore($panel);
                $accordionAnchor = $('<a></a>').attr('href', panelSelector).html($anchor.html()).appendTo($accordionTab);

                var oTab = {
                    _ignoreHashChange: false,
                    id: id,
                    disabled: ($.inArray(id, _this.options.disabled) !== -1),
                    tab: $(this),
                    anchor: $('a', $tab),
                    panel: $panel,
                    selector: panelSelector,
                    accordionTab: $accordionTab,
                    accordionAnchor: $accordionAnchor,
                    active: false
                };

                // 1up the ID
                id++;
                // Add to tab array
                tabs.push(oTab);
            }
        });
        return tabs;
    };


    /**
     * This function adds classes to the tab elements based on the options
     */
    ResponsiveTabs.prototype._loadClasses = function() {
        for (var i=0; i<this.tabs.length; i++) {
            this.tabs[i].tab.addClass(this.options.classes.stateDefault).addClass(this.options.classes.tab);
            this.tabs[i].anchor.addClass(this.options.classes.anchor);
            this.tabs[i].panel.addClass(this.options.classes.stateDefault).addClass(this.options.classes.panel);
            this.tabs[i].accordionTab.addClass(this.options.classes.accordionTitle);
            this.tabs[i].accordionAnchor.addClass(this.options.classes.anchor);
            if(this.tabs[i].disabled) {
                this.tabs[i].tab.removeClass(this.options.classes.stateDefault).addClass(this.options.classes.stateDisabled);
                this.tabs[i].accordionTab.removeClass(this.options.classes.stateDefault).addClass(this.options.classes.stateDisabled);
           }
        }
    };

    /**
     * This function adds events to the tab elements
     */
    ResponsiveTabs.prototype._loadEvents = function() {
        var _this = this;

        // Define activate event on a tab element
        var fActivate = function(e) {
            var current = _this._getCurrentTab(); // Fetch current tab
            var activatedTab = e.data.tab;

            e.preventDefault();

            // Make sure this tab isn't disabled
            if(!activatedTab.disabled) {

                // Check if hash has to be set in the URL location
                if(_this.options.setHash) {
                    // Set the hash using the history api if available to tackle Chromes repaint bug on hash change
                    if(history.pushState) {
                        history.pushState(null, null, activatedTab.selector);
                    } else {
                        // Otherwise fallback to the hash update for sites that don't support the history api
                        window.location.hash = activatedTab.selector;
                    }
                }

                e.data.tab._ignoreHashChange = true;

                // Check if the activated tab isnt the current one or if its collapsible. If not, do nothing
                if(current !== activatedTab || _this._isCollapisble()) {
                    // The activated tab is either another tab of the current one. If it's the current tab it is collapsible
                    // Either way, the current tab can be closed
                    _this._closeTab(e, current);

                    // Check if the activated tab isnt the current one or if it isnt collapsible
                    if(current !== activatedTab || !_this._isCollapisble()) {
                        _this._openTab(e, activatedTab, false, true);
                    }
                }
            }
        };

        // Loop tabs
        for (var i=0; i<this.tabs.length; i++) {
            // Add activate function to the tab and accordion selection element
            this.tabs[i].anchor.on(_this.options.event, {tab: _this.tabs[i]}, fActivate);
            this.tabs[i].accordionAnchor.on(_this.options.event, {tab: _this.tabs[i]}, fActivate);
        }
    };

    /**
     * This function gets the tab that should be opened at start
     * @returns {Object} Tab object
     */
    ResponsiveTabs.prototype._getStartTab = function() {
        var tabRef = this._getTabRefBySelector(window.location.hash);
        var startTab;
        
        // Check if the page has a hash set that is linked to a tab
        if(tabRef >= 0 && !this._getTab(tabRef).disabled) {
            // If so, set the current tab to the linked tab
            startTab = this._getTab(tabRef);
        } else if(this.options.active > 0 && !this._getTab(this.options.active).disabled) {
            startTab = this._getTab(this.options.active);
        } else {
            // If not, just get the first one
            startTab = this._getTab(0);
        }

        return startTab;
    };

    /**
     * This function sets the current state of the plugin
     * @param {Event} e - The event that triggers the state change
     */
    ResponsiveTabs.prototype._setState = function(e) {
        var $ul = $('ul', this.$element);
        var oldState = this.state;
        var startCollapsedIsState = (typeof this.options.startCollapsed === 'string');
        var startTab;

        // The state is based on the visibility of the tabs list
        if($ul.is(':visible')){
            // Tab list is visible, so the state is 'tabs'
            this.state = 'tabs';
        } else {
            // Tab list is invisible, so the state is 'accordion'
            this.state = 'accordion';
        }

        // If the new state is different from the old state
        if(this.state !== oldState) {
            // If so, the state activate trigger must be called
            this.$element.trigger('tabs-activate-state', {oldState: oldState, newState: this.state});

            // Check if the state switch should open a tab
            if(oldState && startCollapsedIsState && this.options.startCollapsed !== this.state && this._getCurrentTab() === undefined) {
                // Get initial tab
                startTab = this._getStartTab(e);
                // Open the initial tab
                this._openTab(e, startTab); // Open first tab
            }


        }
    };

    /**
     * This function opens a tab
     * @param {Event} e - The event that triggers the tab opening
     * @param {Object} oTab - The tab object that should be opened
     * @param {Boolean} closeCurrent - Defines if the current tab should be closed
     * @param {Boolean} stopRotation - Defines if the tab rotation loop should be stopped
     */
    ResponsiveTabs.prototype._openTab = function(e, oTab, closeCurrent, stopRotation) {
        var _this = this;

        // Check if the current tab has to be closed
        if(closeCurrent) {
            this._closeTab(e, this._getCurrentTab());
        }

        // Check if the rotation has to be stopped when activated
        if(stopRotation && this.rotateInterval > 0) {
            this.stopRotation();
        }

        // Set this tab to active
        oTab.active = true;
        // Set active classes to the tab button and accordion tab button
        oTab.tab.removeClass(_this.options.classes.stateDefault).addClass(_this.options.classes.stateActive);
        oTab.accordionTab.removeClass(_this.options.classes.stateDefault).addClass(_this.options.classes.stateActive);

        // Run panel transiton
        _this._doTransition(oTab.panel, _this.options.animation, 'open', function() {
            // When finished, set active class to the panel
            oTab.panel.removeClass(_this.options.classes.stateDefault).addClass(_this.options.classes.stateActive);
          
           // And if enabled and state is accordion, scroll to the accordion tab
            if(_this.getState() === 'accordion' && _this.options.scrollToAccordion && (!_this._isInView(oTab.accordionTab) || _this.options.animation !== 'default')) {
                // Check if the animation option is enabled, and if the duration isn't 0
                if(_this.options.animation !== 'default' && _this.options.duration > 0) {
                    // If so, set scrollTop with animate and use the 'animation' duration
                    $('html, body').animate({
                        scrollTop: oTab.accordionTab.offset().top
                    }, _this.options.duration);
                } else {
                    //  If not, just set scrollTop
                    $('html, body').scrollTop(oTab.accordionTab.offset().top);
                }
            }
        });



        this.$element.trigger('tabs-activate', oTab);
    };

    /**
     * This function closes a tab
     * @param {Event} e - The event that is triggered when a tab is closed
     * @param {Object} oTab - The tab object that should be closed
     */
    ResponsiveTabs.prototype._closeTab = function(e, oTab) {
        var _this = this;

        if(oTab !== undefined) {

            // Deactivate tab
            oTab.active = false;
            // Set default class to the tab button
            oTab.tab.removeClass(_this.options.classes.stateActive).addClass(_this.options.classes.stateDefault);

            // Run panel transition
            _this._doTransition(oTab.panel, _this.options.animation, 'close', function() {
                // Set default class to the accordion tab button and tab panel
                oTab.accordionTab.removeClass(_this.options.classes.stateActive).addClass(_this.options.classes.stateDefault);
                oTab.panel.removeClass(_this.options.classes.stateActive).addClass(_this.options.classes.stateDefault);
            }, true);

            this.$element.trigger('tabs-deactivate', oTab);
        }
    };

    /**
     * This function runs an effect on a panel
     * @param {Element} panel - The HTML element of the tab panel
     * @param {String} method - The transition method reference
     * @param {String} state - The state (open/closed) that the panel should transition to
     * @param {Function} callback - The callback function that is called after the transition
     * @param {Boolean} dequeue - Defines if the event queue should be dequeued after the transition
     */
    ResponsiveTabs.prototype._doTransition = function(panel, method, state, callback, dequeue) {
        var effect;
        var _this = this;

        // Get effect based on method
        switch(method) {
            case 'slide':
                effect = (state === 'open') ? 'slideDown' : 'slideUp';
                break;
            case 'fade':
                effect = (state === 'open') ? 'fadeIn' : 'fadeOut';
                break;
            default:
                effect = (state === 'open') ? 'show' : 'hide';
                // When default is used, set the duration to 0
                _this.options.duration = 0;
                break;
        }

        // Add the transition to a custom queue
        this.$queue.queue('responsive-tabs',function(next){
            // Run the transition on the panel
            panel[effect]({
                duration: _this.options.duration,
                complete: function() {
                    // Call the callback function
                    callback.call(panel, method, state);
                    // Run the next function in the queue
                    next();
                }
            });
        });

        // When the panel is openend, dequeue everything so the animation starts
        if(state === 'open' || dequeue) {
            this.$queue.dequeue('responsive-tabs');
        }

    };

    /**
     * This function returns the collapsibility of the tab in this state
     * @returns {Boolean} The collapsibility of the tab
     */
    ResponsiveTabs.prototype._isCollapisble = function() {
        return (typeof this.options.collapsible === 'boolean' && this.options.collapsible) || (typeof this.options.collapsible === 'string' && this.options.collapsible === this.getState());
    };

    /**
     * This function returns a tab by numeric reference
     * @param {Integer} numRef - Numeric tab reference
     * @returns {Object} Tab object
     */
    ResponsiveTabs.prototype._getTab = function(numRef) {
        return this.tabs[numRef];
    };

    /**
     * This function returns the numeric tab reference based on a hash selector
     * @param {String} selector - Hash selector
     * @returns {Integer} Numeric tab reference
     */
    ResponsiveTabs.prototype._getTabRefBySelector = function(selector) {
        // Loop all tabs
        for (var i=0; i<this.tabs.length; i++) {
            // Check if the hash selector is equal to the tab selector
            if(this.tabs[i].selector === selector) {
                return i;
            }
        }
        // If none is found return a negative index
        return -1;
    };

    /**
     * This function returns the current tab element
     * @returns {Object} Current tab element
     */
    ResponsiveTabs.prototype._getCurrentTab = function() {
        return this._getTab(this._getCurrentTabRef());
    };

    /**
     * This function returns the next tab's numeric reference
     * @param {Integer} currentTabRef - Current numeric tab reference
     * @returns {Integer} Numeric tab reference
     */
    ResponsiveTabs.prototype._getNextTabRef = function(currentTabRef) {
        var tabRef = (currentTabRef || this._getCurrentTabRef());
        var nextTabRef = (tabRef === this.tabs.length - 1) ? 0 : tabRef + 1;
        return (this._getTab(nextTabRef).disabled) ? this._getNextTabRef(nextTabRef) : nextTabRef;
    };

    /**
     * This function returns the previous tab's numeric reference
     * @returns {Integer} Numeric tab reference
     */
    ResponsiveTabs.prototype._getPreviousTabRef = function() {
        return (this._getCurrentTabRef() === 0) ? this.tabs.length - 1 : this._getCurrentTabRef() - 1;
    };

    /**
     * This function returns the current tab's numeric reference
     * @returns {Integer} Numeric tab reference
     */
    ResponsiveTabs.prototype._getCurrentTabRef = function() {
        // Loop all tabs
        for (var i=0; i<this.tabs.length; i++) {
            // If this tab is active, return it
            if(this.tabs[i].active) {
                return i;
            }
        }
        // No tabs have been found, return negative index
        return -1;
    };

    //
    // HELPER FUNCTIONS
    // 

    ResponsiveTabs.prototype._isInView = function($element) {
        var docViewTop = $(window).scrollTop(),
            docViewBottom = docViewTop + $(window).height(),
            elemTop = $element.offset().top,
            elemBottom = elemTop + $element.height();
        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    };

    //
    // PUBLIC FUNCTIONS
    //

    /**
     * This function activates a tab
     * @param {Integer} tabRef - Numeric tab reference
     * @param {Boolean} stopRotation - Defines if the tab rotation should stop after activation
     */
    ResponsiveTabs.prototype.activate = function(tabRef, stopRotation) {
        var e = jQuery.Event('tabs-activate');
        var oTab = this._getTab(tabRef);
        if(!oTab.disabled) {
            this._openTab(e, oTab, true, stopRotation || true);
        }
    };

    /**
     * This function deactivates a tab
     * @param {Integer} tabRef - Numeric tab reference
     */
    ResponsiveTabs.prototype.deactivate = function(tabRef) {
        var e = jQuery.Event('tabs-dectivate');
        var oTab = this._getTab(tabRef);
        if(!oTab.disabled) {
            this._closeTab(e, oTab);
        }
    };

    /**
     * This function gets the current state of the plugin
     * @returns {String} State of the plugin
     */
    ResponsiveTabs.prototype.getState = function() {
        return this.state;
    };

    /**
     * This function starts the rotation of the tabs
     * @param {Integer} speed - The speed of the rotation
     */
    ResponsiveTabs.prototype.startRotation = function(speed) {
        var _this = this;
        // Make sure not all tabs are disabled
        if(this.tabs.length > this.options.disabled.length) {
            this.rotateInterval = setInterval(function(){
                var e = jQuery.Event('rotate');
                _this._openTab(e, _this._getTab(_this._getNextTabRef()), true);
            }, speed || (($.isNumeric(_this.options.rotate)) ? _this.options.rotate : 4000) );
        } else {
            throw new Error("Rotation is not possible if all tabs are disabled");
        }
    };

    /**
     * This function stops the rotation of the tabs
     */
    ResponsiveTabs.prototype.stopRotation = function() {
        window.clearInterval(this.rotateInterval);
        this.rotateInterval = 0;
    };

    /** jQuery wrapper */
    $.fn.responsiveTabs = function ( options ) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'responsivetabs')) {
                    $.data(this, 'responsivetabs', new ResponsiveTabs( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            return this.each(function () {
                var instance = $.data(this, 'responsivetabs');

                if (instance instanceof ResponsiveTabs && typeof instance[options] === 'function') {
                    instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    // TODO: destroy instance classes, etc
                    $.data(this, 'responsivetabs', null);
                }
            });
        }
    };

}(jQuery, window));

 ; 

return null; 

});


//@ sourceURL=/vendor/jquery.responsiveTabs.js

;
require(["modules/jquery-mozu", "underscore", "hyprlive", "modules/backbone-mozu", "modules/cart-monitor",
        "modules/models-product",
        "modules/views-productimages","widgets/powerreviews", "modules/api", "modules/modal", "hyprlivecontext",
        "modules/jquery-dateinput-localized",
        "shim!vendor/jquery.responsiveTabs[jquery=jQuery]"

    ],
    function ($, _, Hypr, Backbone, CartMonitor, ProductModels, ProductImageViews, PowerReviewsWidget, Api, ModalWindow, HyprLiveContext) {

        var cdnquality = Hypr.getThemeSetting("cdnQuality");
        var qmodalTemplate = Hypr.getTemplate('modules/product/product-customization'),
            CustomOptionModel,
            modal,
            getRenderProductContext = function (substituteModel) {
                var model = (substituteModel || this.model).toJSON({
                    helpers: true
                });
                return {
                    Model: model,
                    model: model
                };
            };    

        CustomOptionModel = function (target, cartViewObj, producttype) {
            var filteredGoal, self = this;
            self.e = target;
            self.cartViewObj = cartViewObj;
            self.render(qmodalTemplate.render(getRenderProductContext(cartViewObj)));  
            var data = self.cartViewObj.apiModel.data.options;
            sessionStorage.setItem('custbulb', JSON.stringify(self.cartViewObj.attributes));
            var ss = self.cartViewObj.attributes;
            var searchfil;

            var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
            var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
            var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
            if(producttype === "single_customised_bulbs"){ 
                filteredGoal = _.where(data, {attributeFQN: custoption1});
                filterdatas(filteredGoal); 
            }else if(producttype ==="multiple_customised_bulbs"){
                filteredGoal = _.where(data, {attributeFQN: custoption2}); 
                if(filteredGoal)filterdatas(filteredGoal);
                filteredGoal1 = _.where(data, {attributeFQN: custoption3}); 
                if(filteredGoal1)filterdatas(filteredGoal1);
            }
        };

        $.extend(CustomOptionModel.prototype = new ModalWindow(), {
            constructor: CustomOptionModel,
            render: function (html) {    

                var currentquantity = $(document).find(".mz-productdetail-qty").val();
                var $modal = $(html);
                $modal.find('.mz-productdetail-qty').val(currentquantity);
                this.updatequantity(this, currentquantity);
                this.loadWrapper($modal.appendTo('body'));
                this.bindClose();
                this.open();
                this.otherEvent();
                this.events($modal);
                $(".optionselected").removeClass("optionselected");  
            },
            events: function ($modal) {
                var self = this;
                $modal.find('.select_customised_bulb').on('click', function (e) {
                    $(e.target).parents('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                    $(e.target).parents('.Optioncontainer').find(".mz-product-next").attr("disabled", "disabled");
                    $(e.target).parents('.mz-modal__inner').find(".mz-productdetail-addtocart").attr("disabled", "disabled");
                    $(e.target).parents('.mz-modal__inner').find(".mz-productdetail-addtowiishlist").attr("disabled", "disabled");
                    $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").find(".optionselected").removeClass("optionselected");
                    $(e.currentTarget).parents(".customised_view").find(".mz-productoptions-valuecontainer").find(".selectedoption").removeClass("selectedoption");
                    $(e.target).parents('.mz-productoptions-valuecontainer').next().show();
                    var eleopt = $(e.currentTarget).parents(".customised_view").find(".mostpopular").attr("mostopt");
                    var objjs = self.cartViewObj.getConfiguredOptions();
                    _.each(objjs, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if((optv.attributes.attributeFQN === eleopt)){
                            optv.unset("value");  
                        }
                    });
                });
                $modal.find('.custom_options').on('click', function (e) {
                    var objjs = self.cartViewObj.getConfiguredOptions();
                    var optionnothanks = $(e.currentTarget).attr("customisenothanks");
                    var ss = $(e.currentTarget).attr("description");
                    if ($(window).width() < 768) {
                        $(e.currentTarget).parents(".options").find(".description-mobile").html(ss);
                    } else {
                        $(e.currentTarget).parents(".option-container").next().html(ss);
                    }
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").css("display", "none");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").text("");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#wattagelabel").removeClass("selectopt");
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#wattagelabel").text("");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').css("display", "none");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').find(".selectedoption").find(".optionselected").removeClass("optionselected");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('.customise_products').find(".selectedoption").removeClass("selectedoption");
                    $(e.currentTarget).parents(".customised_view").find(".customise_block").find('input[type="radio"]').each(function () {
                        $(this).attr("checked", false);
                        if ($(this).parents(".parent_type").attr("id") !== "BulbType") {
                            $(this).parents(".options").css("display", "none");
                            $(this).parents(".parent_type").css("display", "none");
                            $(this).parents(".mz-option-space").find(".description-mobile").html("");
                            $(this).parents(".mz-option-space").find(".description").html("");
                        }
                    });
                    var selectedopt = $(e.currentTarget).attr("nothank_opt"); 
                    var mostopt = $(e.currentTarget).parents(".customised_view").find(".mostpopular").attr("mostopt");
                    var eleopt = $(e.currentTarget).parents(".customised_view").find(".customizebulb").attr("valopt");
                    if (optionnothanks !== undefined) {
                        $(e.currentTarget).parents(".customised_view").find(".mostpopular").find('input[type="radio"]').each(function () {
                            $(this).attr("checked", false);
                            $(this).removeClass("optionselected");
                            $(this).parents(".options").removeClass("selectedoption");
                        });
                        _.each(objjs, function (objoptions) {
                            var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                            if ((optv.attributes.attributeFQN === selectedopt) || (optv.attributes.attributeFQN === mostopt)) {
                                optv.unset("value");
                            }
                        });
                    } else {  
                        if (self.cartViewObj.attributes.productType === "multiple_customised_bulbs") {  
                            _.each(objjs, function (objoptions) {
                                var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                                if (optv.attributes.attributeFQN === eleopt) {
                                    optv.unset("value");
                                }
                            });
                        } else {
                            _.each(objjs, function (objoptions) {
                                var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                                if (optv.attributes.attributeFQN === eleopt) {
                                    optv.unset("value");
                                }  
                            });
                        }

                    }
                });
                $modal.find('.mz-sub-qty').on('click', function (e) {
                    var quantity = parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                    var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                    self.minusqty(val, quantity);
                });
                $modal.find('.mz-add-qty').on('click', function (e) { 
                    var quantity = parseInt($(e.currentTarget).parent().find(".mz-productdetail-qty").val());
                    var val = $(e.currentTarget).parent().find(".mz-productdetail-qty");
                    self.addqty(val, quantity);
                });
                $modal.find('[data-mz-product-option]').on('change', function () {
                    self.onOptionChange(this);
                });
                $modal.find('.mz-productdetail-qty').on('keypress', function (e) {    
                    var regex = new RegExp("^[0-9-]+$");  
                    var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
                    var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                    if (verified === null) { 
                            
                          }else{
                               $(obj).val($(obj).val().replace(/\D/g, "")); 
                              
                          } 
                }); 
                $modal.find('.mz-productdetail-qty').on('change', function (e) {
                    var quantity = $(e.currentTarget).val();
                    self.updatequantity(this, quantity);
                });
                $modal.find('#add-to-cart').on('click', function () {
                    var data = _.where(self.cartViewObj.get("options").toJSON(),{isRequired : true});
                    _.each(data,function(opt){   
                        if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                            val = _.where(self.cartViewObj.getConfiguredOptions(),{attributeFQN : opt.attributeFQN });
                            if((val === undefined)||(val.length < 1)){
                                option = self.cartViewObj.get('options').get(opt.attributeFQN);
                                option.set('value', opt.values[0].value);
                            }             
                        }
                    }); 
                    self.addToCart(this);
                    
                    
                });  
                $modal.find('[data-mz-product-option]').on('change', function (e) {
                    var $target = $(e.currentTarget).val();
                    var descr = $(e.currentTarget).attr("description");
                    var obj = $(e.currentTarget);  

                    if ($(window).width() < 768) {
                        $(obj).parents(".option-container").find(".description-mobile").each(function () {
                            $(this).html("");
                        });
                        $(obj).parents(".options").find(".description-mobile").html(descr);
                    } else {
                        if (descr) {
                            $(obj).parents(".option-container").next().html(descr);
                        }
                    }
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text($(e.currentTarget).attr("prnames"));
                    $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").addClass("selectopt");
                    $(e.currentTarget).parents(".option-container").find(".options").each(function () {
                        $(this).removeClass("selectedoption");
                    });
                    $(e.currentTarget).parents(".options").addClass("selectedoption");
                    $(obj).closest(".option-container").find(".optionselected").removeClass("optionselected");
                    $(obj).addClass("optionselected");
                    var optionprice = 0;
                    var prodprice = 0;

                    var options = [];
                    $(".optionselected").each(function () {


                        var optobj = {};
                        if ($(this).attr("customisenothanks") !== "nothanks") {
                            if ($(this).attr("option-type").toLowerCase() == "option") {
                                optionprice += 0;

                                optobj.attributeFQN = $(this).data("mz-product-option");
                                optobj.value = $(this).attr("value");
                                options.push(optobj);
                            } else {
                                optionprice += parseFloat($(this).attr("optionprice"));

                                optobj.attributeFQN = $(this).data("mz-product-option");
                                optobj.value = $(this).attr("value");
                                options.push(optobj);
                            }
                        }

                        prodprice = $(this).attr("pordprice");
                    });

                    var prodcode = $('[data-mz-prodtcode]').first().data('mzProdtcode');
                    Api.request("post", "/api/commerce/catalog/storefront/products/" + prodcode + "/configure?includeOptionDetails=true", {
                        options: options
                    }).then(function (response) {
                        var optprice=0;
                        if(response.price){
                            if(response.price.salePrice){
                                optprice=response.price.salePrice;
                            }else{
                                optprice=response.price.price;
                            }
                        }else if(response.priceRange){
                            if(response.priceRange.lower.salePrice){
                                optprice=response.priceRange.lower.salePrice;
                            }else{
                                optprice=response.priceRange.lower.price;
                            }  
                        } 
                        self.selectedPrice(optprice,obj);
                    });

                    self.productOPtionChange(obj, $target);
                });
                $modal.find('.close-icon').on('click', function () {

                    var objj = self.cartViewObj.getConfiguredOptions();
                    var newobj = [];
                    _.each(objj, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN != "tenant~color" && optv.attributes.attributeFQN != "tenant~lead-wire" && optv.attributes.attributeFQN != "tenant~color-temperature-option" && optv.attributes.attributeFQN != "tenant~size") {
                            optv.unset("value"); 
                        }
                    });
                    
                    $('body').css({'height':'auto', 'position': 'static'}); 
                    
                    setTimeout(function () {
                        $('[data-mz-role="modal-close"]').trigger('click');
                        $("#tz-cart-dialog").remove();
                        $(".cart-overlay").remove();
                    }, 500);

                });

                //--- this is for overlay wishList

                $modal.find('[data-mz-action="guestCustomWishlist"]').on('click', function (e) {

                    //close the custom overlay
                    $('[data-mz-role="modal-close"]').trigger('click');
                    $("#tz-cart-dialog").remove();
                    $(".cart-overlay").remove();

                    $('[data-mz-loginpopup]').trigger('click');

                    //randomstring for verification
                    var randomString = Math.random().toString(36).substr(2, 8),
                        customProObj = {};

                    $.each(self.cartViewObj.getConfiguredOptions(), function (i, v) {
                        customProObj[v.attributeFQN] = v.value;
                    });

                    if (history.pushState && "" !== $.param(customProObj)) {
                        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                            newDate = new Date();

                        newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                        window.history.pushState({
                            path: newurl
                        }, '', newurl);
                        document.cookie = "guestWishList=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                    }
                    
                    var objj = self.cartViewObj.getConfiguredOptions();
                    var newobj = [];
                    _.each(objj, function (objoptions) {
                        var optv = self.cartViewObj.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN != "tenant~color") {
                            if (optv.attributes.attributeFQN != "tenant~lead-wire")
                            {
                                optv.unset("value");
                            }
                        }   
                    });
                    
                });
                $modal.find('[data-mz-action="addToWishlist"]').on('click', function (e) {
                    var obj = e.currentTarget;
                    $(obj).addClass("is-processing");
                    self.addToWishlist(e);
                });
            },
            addqty: function ($qty, currentVal) {
                if (!isNaN(currentVal) && currentVal < 999) {
                    $qty.val(currentVal + 1);
                    var quantity = currentVal + 1;
                    this.updatequantity($qty, quantity);
                }
            },
            minusqty: function ($qty, currentVal) {
                if (!isNaN(currentVal) && currentVal > 1) {
                    $qty.val(currentVal - 1);
                    var quantity = currentVal - 1;
                    this.updatequantity($qty, quantity);
                }
            },
            selectedPrice: function (optionprice, obj) {

                var quantity = (obj).parents(".mz-modal").find(".price-qty-block").find(".mz-productdetail-qty").val();
                var quanityupdateprice = optionprice * quantity;
                var newupdateprice = quanityupdateprice.toFixed(2);
                $(obj).parents(".mz-modal").find(".price-qty-block").find(".upd_price").text("$" + newupdateprice);
            },
            productOPtionChange: function (obj, value) {
                var t = Api.context.tenant;
                var s = Api.context.site;
                var filepath = ""+require.mozuData("sitecontext").cdnPrefix+"/cms/" + s + "/files/";

                var $target = value;

                var loadimgsrc = "" + filepath + "/loading-small-flat.gif";
                var loadimg = "<img src=" + loadimgsrc + "></img>";
                $(obj).closest(".mz-productoptions-valuecontainer").find(".img-slot").html(loadimg);
                var imgsrc = "";
                if ($target != "None" && $(obj).attr("option-type") != "Option") {
                     Api.get('product', $target).then(function (sdkProduct) {

                        if (sdkProduct.data.content.productImages.length > 0) {
                            imgsrc = sdkProduct.data.content.productImages[0].imageUrl;
                        } else {
                            imgsrc = "" + filepath +"nooption.png";
                        }
                        var imghtml = "<img src=" + imgsrc + "></img>";
                        obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                    }, function(err){
                        if(err.errorCode=="ITEM_NOT_FOUND"){
                            var indexdae= err.message.split("baseproductCode:")+16;
                            var code=err.message.substring(90);
                            
                             Api.get('product', code).then(function (sdkProduct) {

                                if (sdkProduct.data.content.productImages.length > 0) {
                                    imgsrc = sdkProduct.data.content.productImages[0].imageUrl;
                                } else {
                                    imgsrc = ""+filepath +"nooption.png";
                                }
                                var imghtml = "<img src=" + imgsrc + "></img>";
                                obj.closest(".mz-productoptions-valuecontainer").find(".img-slot").html(imghtml);
                            });
                            
                        }  
                            
                          });
                

                } else {
                    var imghtml = ""+filepath+"nooption.png";
                    obj.closest(".mz-productoptions-valuecontainer").find(".imgse-slot").html(imghtml);
                }
            },
            updatequantity: function (obj, value) {
                this.cartViewObj.set({
                    "quantity": value
                });

                var price = 0;
                if (this.cartViewObj.get("price").attributes.price) {
                    if (this.cartViewObj.get("price").get("salePrice")) {
                        price = this.cartViewObj.get("price").get("salePrice");
                    } else {
                        price = this.cartViewObj.get("price").get("price");
                    }
                } else if (this.cartViewObj.get("priceRange").attributes.lower) {
                price=this.cartViewObj.get("priceRange").get("lower").get("price");    
                }
                var Updatetotal = value * price;
                $(obj).closest(".price-qty-block").find(".upd_price").text("$" + Updatetotal.toFixed(2));

            },
            addToCart: function (obj) {

                $("body").find('#tz-cart-dialog').find('.productcustomize').attr('disabled', "disabled");

                Api.on('error', function (badPromise, xhr, requestConf) {
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                    var erroHtml = "<ul class='is-showing mz-errors'><li>" + badPromise.message + "<li>";

                    $(obj).parents('.mz-modal-outer').find(".mz-messagebar").html(erroHtml);
                });
                this.cartViewObj.on('addedtocart', function () {
                    $(obj).addClass("is-processing");
                    $('[data-mz-role="modal-close"]').trigger('click');
                    
                    if($(window).scrollTop() > $('.mz-l-container').height() + 30) {
                        $('body,html').scrollTop(100);
                    }
                    $(".cart-overlay").remove();
                    CartMonitor.updateCart();

                });

                this.cartViewObj.addToCart();

            },
            onOptionChange: function (e) {
                this.configure($(e));
            },
            configure: function ($optionEl) {
                var EliminateProduct = Hypr.getThemeSetting("nothanks");
                var newValue = $optionEl.val(),
                    oldValue,
                    id = $optionEl.data('mz-product-option'),
                    optionEl = $optionEl[0],
                    isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                    option = this.cartViewObj.get('options').get(id);
                if (newValue != EliminateProduct) {
                    if (option) {
                        if (option.get('attributeDetail').inputType === "YesNo") {
                            option.set("value", isPicked);
                        } else if (isPicked) {
                            oldValue = option.get('value');
                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                option.set('value', newValue);

                            }
                        }
                    }
                } else {
                    if (option.get("value") !== undefined) {
                        option.unset("value");
                    }
                }
            },
            otherEvent: function () {
                var $that = this;
            },
            addToWishlist: function (e) {
                this.cartViewObj.addToWishlist();
                this.cartViewObj.on('addedtowishlist', function (cartitem) {
                    $(e.target).prop('disabled', 'disabled').text(Hypr.getLabel('addedToWishlist'));
                });
            }
        });
        // End of Customized add to cart

        var ProductView = Backbone.MozuView.extend({
            templateName: 'modules/product/product-detail',
            autoUpdate: ['quantity'],
            additionalEvents: {
                "click .mz-prdOption": "showAddToCartDialog",

                "click .color-span" : "switchSelectedImage",
                "change .mz-size-content": "sizeUpdate",
                "click .mz-backorder-button": "backOrderPopUp",
                "keyup .mz-productdetail-qty": "quantityBox",
                "keypress .mz-productdetail-qty": "quantityBox",
                "change .mz-productdetail-qty": "quantityBoxVal"

            },
            
            quantityBox: function(e) {
                
                var qtyEle = e.target;
                var qtyMaxValue = (this.model.get("inventoryInfo") ? this.model.get("inventoryInfo").onlineStockAvailable : 0 ),
                    qtyCurrentValue = parseInt($(qtyEle).val());
                
                if( "undefined" == qtyMaxValue || 1 > qtyMaxValue )
                {
                    if(this.model.get("inventoryInfo").outOfStockBehavior === "AllowBackOrder")
                    {
                        qtyMaxValue = 500;
                    }
                }
                
                // allow only numbers
              var verified = (e.which === 8 || e.which === undefined || e.which === 0) ? null : String.fromCharCode(e.which).match(/[^0-9]/);
                         if (verified === null) { 
                            
                          }else{
                               $(obj).val($(obj).val().replace(/\D/g, "")); 
                              
                          } 
                       
                   
              /*  $(qtyEle).val($(qtyEle).val().replace(/\D/g, ""));*/
                
                if ((event.which < 48 || event.which > 57)) {
                    event.preventDefault();
                }
                if (qtyCurrentValue > qtyMaxValue)
                {
                    $(qtyEle).val(qtyMaxValue);
                    $(qtyEle).parent().find(".mz-validationmessage").fadeIn(200);
                    if(qtyMaxValue === 1){
                        $(qtyEle).parent().find(".mz-validationmessage").html("Not in Stock. Please enter below 2");
                    }else{
                        $(qtyEle).parent().find(".mz-validationmessage").html("Not in Stock. Please enter below "+qtyMaxValue);
                    }
                    $(qtyEle).parent().find(".mz-validationmessage").delay(1000).fadeOut(500);
                }
            },
            quantityBoxVal: function(e) {
                var qtyEle = e.target;
                if(parseInt($(qtyEle).val()) === 0 ||  $(qtyEle).val() === "")
                {
                    $(qtyEle).val(1);
                }
            },
            
            backOrderPopUp: function (e) { 
                $('.mz-backorder-popup').fadeIn(500);
            },

            
            sizeUpdate: function (e) {  
                if($(e.target).attr("data-mz-product-option") === "tenant~size"){
                    $('.product-size-selected-value').html($(e.target).find('option:selected').html());    
                }else if($(e.target).attr("data-mz-product-option") === "tenant~lead-wire"){
                    $('.product-leadwire-selected-value').html($(e.target).find('option:selected').html());    
                }else if($(e.target).attr("data-mz-product-option") === "tenant~color-temperature-option"){
                    $('.product-temperature-selected-value').html($(e.target).find('option:selected').html());    
                }  
                $('.mz-price').fadeTo(0, 0.2);
                $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").addClass("is-processing");
                $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").html("Processing..."); 
                this.onOptionChange($(e.target));
            },
            render: function () {
                var me = this;
                var val = false;
                 _.each(this.model.attributes.options.toJSON(),function(opt){
                    if((opt.attributeDetail.usageType === "Extra") && (opt.isRequired) && (opt.values[0].deltaPrice < 1)&&(opt.values.length === 1)){
                        val = true;             
                    }
                });
                if(val){   
                    this.model.set("crproduct", true);
                }
                var pricelabel = $(document).find("#customersegmentval").val();
                var priceval = $(document).find("#customersegmentvallabel").val();
                if((pricelabel !== undefined)&&(priceval !== undefined)){
                    this.model.attributes.segpricelabel=priceval;
                }    
                var msrp = this.model.attributes.price.attributes.msrp;
                var quantity = this.model.attributes.quantity;
                var price = (this.model.attributes.price.attributes.salePrice) ? this.model.attributes.price.attributes.salePrice : this.model.attributes.price.attributes.price;
                var tempval = (msrp * quantity) - (price * quantity);
                var saveprice = tempval.toFixed(2);
                me.model.set("saveprice", saveprice);
                Backbone.MozuView.prototype.render.apply(this);
                
                var userlabel = require.mozuData("user").isAnonymous;
                if(!userlabel){
                    $(document).find(".customersaleprice").each(function(){
                        $(this).show();
                    });
                }
                var sele = $('.mz-productoptions-option.sb-color'),
                    selected_color = $.trim(sele.val());
                
                $('.mz-productlisting-savings').find('span').html((saveprice != "undefined" ? "$"+saveprice : ""));
                
                if (selected_color !== "") {
                    $('.product-color-selected-value').html($('.mz-productoptions-option.sb-color option:selected').text());
                }
                
                //if($('.mz-size-content') !== "undefined")
                //    $('.product-size-selected-value').html($('.mz-size-content').find('option:selected').html());
                
                if($('.mz-size-content').length > 0){
                    $('.mz-size-content').each(function(i,j){
                        if($(j).attr("data-mz-product-option") === "tenant~size"){
                            $('.product-size-selected-value').html($(j).find('option:selected').html());    
                        }else if($(j).attr("data-mz-product-option") === "tenant~lead-wire"){
                            $('.product-leadwire-selected-value').html($(j).find('option:selected').html());    
                        }else if($(j).attr("data-mz-product-option") === "tenant~color-temperature-option"){
                            $('.product-temperature-selected-value').html($(j).find('option:selected').html());    
                        }
                    });   
                }
                
                $('.mz-productlisting-savings').children('span').html("$"+saveprice);
                
                $('.internalLinks a').on('click', function () {

                    if ($(this).hasClass('videos')) {
                        if ($(window).width() > 767) {
                            $(".product-detail-tabs").find("a[href='#tab-6']").trigger("click");
                            if ($('.video-preview').find(".item").length > 4 && !$('.video-preview').hasClass('.owl-carousel')) {
                                $('.video-preview').owlCarousel({
                                    loop: true,
                                    margin: 10,
                                    nav: true,
                                    items: 3
                                });
                            }
                        } else {
                            $(".r-tabs-accordion-title").find("a[href='#tab-6']").trigger("click");
                        }
                    } else if ($(this).hasClass('downloads')) {
                        $(".product-detail-tabs").find("a[href='#tab-2']").trigger("click");
                    } else if ($(this).hasClass('specification')) {
                        $(".product-detail-tabs").find("a[href='#tab-3']").trigger("click");
                    }

                    $("html, body").animate({
                        scrollTop: $('#horizontalTab').offset().top - 100   
                    }, 100);
                });

                
                $('.spec-link').on('click', function(e) {
                    e.stopPropagation();  
                    if($(this).parent().hasClass('r-tabs-state-active'))
                    {
                        $(".product-detail-tabs").find("a[href='#tab-2']").trigger("click");
                        $("html, body").animate({
                            scrollTop: $('#horizontalTab').offset().top - 100
                        });
                    }
                });
                
                if ("undefined" != typeof $.cookie("guestWishList")) {

                    var cookieData = $.cookie("guestWishList").split('|'),
                        optValue = {},
                        option,
                        thisModel = this.model;

                    if (cookieData[0] == location.search.replace('?', '')) {
                        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '';

                        if (cookieData.length == 2) {
                            cookieData[1].split("&").map(function (value) {
                                optValue[value.split("=")[0]] = value.split("=")[1];
                            });

                            if (!require.mozuData("pagecontext").user.isAnonymous) {

                                $.each(optValue, function (i, v) {
                                    option = thisModel.get('options').get(i);
                                    option.set('value', v);
                                });
                                $('.mz-wishproductlist').addClass("is-processing"); 
                                thisModel.addToWishlist();
                                document.cookie = "guestWishListe=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                window.history.pushState({
                                    path: newurl
                                }, '', newurl);
                            }

                        } else {
                            if (!require.mozuData("pagecontext").user.isAnonymous) {
                                $('.mz-wishproductlist').addClass("is-processing"); 
                                thisModel.addToWishlist();
                                document.cookie = "guestWishListe=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                window.history.pushState({
                                    path: newurl
                                }, '', newurl);
                            }
                        }
                    }
                }

                $('.mz-backorder-popup button').on('click', function () {
                    $('.mz-backorder-popup').fadeOut(500);
                });
                
                //update quantity box
                if ( this.model.get("inventoryInfo") )
                {
                    if( "undefined" == this.model.get("inventoryInfo").onlineStockAvailable || 1 > this.model.get("inventoryInfo").onlineStockAvailable )
                    {
                        if(this.model.get("inventoryInfo").outOfStockBehavior !== "AllowBackOrder")
                        {
                            $(".mz-productdetail-qty").attr("disabled", "disabled");
                            $(".mz-productdetail-qty").addClass("is-disabled");
                            
                        }
                    }
                    else {
                        $(".mz-productdetail-qty").removeAttr("disabled");
                        $(".mz-productdetail-qty").removeClass("is-disabled");
                    }
                }
                
                //pdp main gallery mobile
                 if($(window).width() > 767 ) {
                     $('.mz-productimages-thumbs').owlCarousel({  
                        dots: false,
                        autoplay:false, 
                        showNavPreview: false,
                        responsive : {    
                            1024 : {
                                loop:false,
                                items: 4
                            },
                            768 : {
                                loop:false,
                                items: 4
                            },
                            640 : {
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumbimage').length > 1 ? true : false),
                                loop: true
                            },
                            300 : {
                                loop: true,
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumbimage').length > 1 ? true : false)
                            }
                        },    
                        nav: ($('.mz-productimages-thumbimage').length > 4 ? true : false),
                        addClassActive:true,
                        navThumbImg: false
                    });
                }

                //google analytics
                
                setTimeout(function(){
                    if($(document).find(".mz-productdetail-conversion-cart").find("#out_of_stock").length > 0){
                        $(document).find(".mz-productdetail-conversion-cart").find("#out_of_stock").click();
                    }
                }, 2000);
                
            },


            showAddToCartDialog: function (e) {
                var $target = e.currentTarget,
                    me = this;
                var flag=true;
                _.each(this.model.get('options').toJSON(), function (val, index) {
                    if(val.attributeDetail.usageType==="Extra" && flag && val.attributeFQN!== require.mozuData("sitecontext").themeSettings.singleCustomisedBulbMostPopularExtra &&  val.attributeFQN!== require.mozuData("sitecontext").themeSettings.doubleCustomisedBulbMostPopularExtra ){
                        if((val.values[0].deltaPrice < 1) && (val.values.length === 1) && (val.isRequired)){
                        }else{
                            flag=false; 
                            me.model.set("closestate",val.attributeFQN);
                        }
                    } 
                    var indv = _.findWhere(me.model.get('options').models, {
                        id: val.attributeFQN
                    });
                    var iscolor = _.contains(_.pluck(me.model.get('options').models, 'id'), "tenant~color");
                    if (indv.id !== "tenant~color") {
                        indv.set('iscolor', iscolor);
                        indv.set('index', index);
                    } else {
                        indv.set('iscolor', iscolor);
                        indv.set('index', "color");
                    }
                });
                var product = this.model;
                var producttype = this.model.attributes.productType;
                var modelW = new CustomOptionModel($target, product, producttype);
                
                $('body').css({'height':$(window).height() , 'overflowY': "hidden", 'position': 'relative', '-ms-overflow-y': "hidden"});

            },
            getKeyByValue: function (obj, value) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if ($.inArray(value, obj[prop]) !== -1)
                            return prop;
                    }
                }
            },
            onOptionChange: function (e) {
                return this.configure(e);
            },
            configure: function ($optionEl) {
                var newValue = $optionEl.val(),
                    oldValue,
                    id = $optionEl.data('mz-product-option'),
                    optionEl = $optionEl[0],
                    isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                    option = this.model.get('options').get(id);
                if (option) {
                    if (option.get('attributeDetail').inputType === "YesNo") {
                        option.set("value", isPicked);
                    } else if (isPicked) {
                        oldValue = option.get('value');
                        if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                            option.set('value', newValue);
                        }
                    }
                }
            },
            addToCart: function (e) {
                var obj = e.currentTarget;
               
                $(obj).addClass("is-processing");
                this.model.addToCart();

                Api.on('error', function (badPromise, xhr, requestConf) {
                    if (badPromise.message.indexOf('limited quantity') != -1) {

                        $(obj).removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');


                    }
                });

            },
             addTocartExtramultiple:function(e){
                var oldValue;
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                     if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                    if(i==dataobj.length-1){
                         me.model.addToCart(); 
                    }
                });  
                   Api.on('error', function (badPromise, xhr, requestConf) {  
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        $target.removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                });
                me.model.on('addedtocart', function () {
                     $target.removeClass("is-processing");
                    CartMonitor.updateCart();

                }); 
                
            },
             addTocartExtra:function(e){
                var oldValue;
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing");
                var id=me.model.get("options").toJSON()[0].attributeFQN;
                var option=me.model.get("options").get(id).toJSON();
                var newValue=$target.data("mz-extracode");
                if(!me.model.get("options").get(id).toJSON().values[0].isSelected){
                   me.model.get("options").get(id).set('value', newValue);     
                }
                
                me.model.addToCart(); 
                    
                Api.on('error', function (badPromise, xhr, requestConf) {  
                    if (badPromise.message.indexOf('limited quantity') != -1) {
                        $target.removeClass("is-processing");
                        badPromise.message = Hypr.getLabel('insufficientinventory');
                    }
                });
                 me.model.on('addedtocart', function () {
                     $target.removeClass("is-processing");
                    CartMonitor.updateCart();

                });
            }, 
            addToWishlist: function (e) {
                var obj = e.currentTarget;
                $(obj).addClass("is-processing");
                this.model.addToWishlist();
            },
            addToWishlistExtra: function (e) {
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                    
                    if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                });  
                this.model.addToWishlist();
            },            
            guestWishlistExtra: function (e) {
                var me=this;
                var $target = $(e.currentTarget);
                $target.addClass("is-processing"); 
                var dataarray=$target.data("mz-extracode").split(",");
                var dataobj=me.model.get("options").toJSON();
                $(dataobj).each(function(i,j){
                    var id=$(this)[0].attributeFQN;
                    var option=me.model.get("options").get(id).toJSON();
                    
                    if(!option.values[0].isSelected){
                        me.model.get("options").get(id).set('value', dataarray[i]);     
                    }
                });
                
                $('[data-mz-loginpopup]').trigger('click');
                
                //randomstring for verification
                var randomString = Math.random().toString(36).substr(2, 8),
                    customProObj = {};

                $.each(me.model.getConfiguredOptions(), function (i, v) {
                    customProObj[v.attributeFQN] = v.value;
                });

                if (history.pushState && "" !== $.param(customProObj)) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                        newDate = new Date();

                    newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                    window.history.pushState({
                        path: newurl
                    }, '', newurl);
                    document.cookie = "guestWishList=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                }
            },
            guestWishlist: function (e) {
                var obj = e.currentTarget,
                    randomString = Math.random().toString(36).substr(2, 8);
                $('[data-mz-loginpopup]').trigger('click');

                if (history.pushState) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                        newDate = new Date();

                    newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                    window.history.pushState({
                        path: newurl
                    }, '', newurl);
                    document.cookie = "guestWishList=" + randomString + ";expires=" + newDate.toUTCString() + ";/";
                }
            },
            checkLocalStores: function (e) {
                var me = this;
                e.preventDefault();
                this.model.whenReady(function () {
                    var $localStoresForm = $(e.currentTarget).parents('[data-mz-localstoresform]'),
                        $input = $localStoresForm.find('[data-mz-localstoresform-input]');
                    if ($input.length > 0) {
                        $input.val(JSON.stringify(me.model.toJSON()));
                        $localStoresForm[0].submit();
                    }
                });

            },
            switchSelectedImage: function (e) {
                var target = $(e.currentTarget);
                var id = $.trim($(e.currentTarget).data('mz-product-option'));
                var coloroption = Hypr.getThemeSetting('coloroption');
                var productData = this.model.apiModel.data;
                if (id == 'tenant~color') {
                    //loader for price
                    $('.mz-price').fadeTo(0, 0.2);
                    
                    //Cart button loader
                    $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").addClass("is-processing");
                    $(".mz-productdetail-conversion-buttons .mz-productdetail-addtocart").html("Processing...");
                    
                    // Product gallery hide
                    if(!$(e.target).hasClass('active'))
                    {
                        $(".loader-product").show();
                        $(".mz-productimages-thumbs").fadeTo(1000, 0.3);
                        $('.mz-productimages-main .mz-productimages-mainimage').fadeTo(1000, 0.3);
                        var ele = $(e.target).attr('color_value');
                        $('.product-color-selected-value').html(ele);
                        
                        $(e.target).siblings(".color-span").css({"opacity":"0.3"});
                        $(e.target).siblings(".active").removeClass("active");
                        $(e.target).addClass("active");
                    }
                    $(this).addClass('activeColorBox');
                    $(this).siblings().removeClass('activeColorBox');

                    $('.color-outer').removeClass("activeColorImage");
                    $(e.currentTarget).parent().addClass("activeColorImage");
                    $('.color_value').css('display', 'block');
                    
                    var select_color = $.trim(target.attr('color_value')),
                        sele = $('.mz-productoptions-option.sb-color'),
                        selectedOpt = $('.mz-productoptions-option.sb-color option:selected');
                    selectedOpt.removeAttr('selected');
                    sele.val(select_color);
                    this.onOptionChange(sele);
                    
                    // To check any disabled options are selected in previous
                    var avoidDisable = this;
                    this.model.get('options').models.map(function(v,i){
                        if(v.id == "tenant~lead-wire" && v.attributes.values.length > 1  && typeof v.attributes.value == "undefined" ){
                            $('.mz-size-content.Option option:selected').removeAttr('selected');
                            avoidDisable.onOptionChange($('.mz-size-content.Option'));
                        }
                    });
                    
                } else {

                    
                }
            },
            initialize: function () {
                // handle preset selects, etc
                var me = this;
                
                this.$('[data-mz-product-option]').each(function () {
                    var $this = $(this),
                        isChecked, wasChecked;
                    var optiontype = $(this).attr("option-type");

                    if (optiontype.toLowerCase() != "extra") {
                        if ($this.data("mz-product-option").toLowerCase() == "tenant~lead-wire") {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        } 
                        else if ($this.data("mz-product-option").toLowerCase() == "tenant~size")  {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        }
                        else if ($this.data("mz-product-option").toLowerCase() == "tenant~color-temperature-option")  {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            } 
                        }
                        else {
                            if ($this.val()) {
                                switch ($this.attr('type')) {
                                case "checkbox":
                                case "radio":
                                    isChecked = $this.prop('checked');
                                    wasChecked = !!$this.attr('checked');
                                    if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                        me.configure($this);
                                    }
                                    break;
                                default:
                                    me.configure($this);
                                }
                            }
                        }
                    }

                });
                Api.request('GET', '/api/commerce/catalog/storefront/categories/tree')
                    .then(function (CategoryTree) {
                        if (CategoryTree.items) {
                            var CategoryItems = CategoryTree.items,
                                catlength = CategoryItems.length,
                                htmlcontent = '';
                            for (var catindex = 0; catindex < catlength; catindex++) {
                                var catrootname = CategoryItems[catindex].categoryId;
                                CategoryHeirachyList[catrootname] = [];
                                var childcatitems = CategoryItems[catindex].childrenCategories;
                                if (childcatitems.length > 0) {
                                    for (var childitemind = 0; childitemind < childcatitems.length; childitemind++) {
                                        CategoryHeirachyList[catrootname].push(childcatitems[childitemind].categoryId);
                                        var subchilditems = childcatitems[childitemind].childrenCategories;
                                        if (subchilditems.length > 0) {
                                            for (var subitemind = 0; subitemind < subchilditems.length; subitemind++) {
                                                CategoryHeirachyList[catrootname].push(subchilditems[subitemind].categoryId);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        var productCategorydata = me.model.apiModel.data.categories;
                        _.each(productCategorydata, function (imgdata) {
                            var catid = me.getKeyByValue(CategoryHeirachyList, imgdata.categoryId);
                            if (catid == 11) {
                                if (PorjectIndex < 4) {
                                    arraydata.push(imgdata.content);
                                }
                                PorjectIndex++;
                            }
                        });

                    });

            }
        });

        var ProductProjectView = Backbone.MozuView.extend({
            templateName: 'modules/product/projectportf1olio',
            render: function () {
                Backbone.MozuView.prototype.render.apply(this, arguments);
            }

        });


    // customization bulb
    var QOModel  = Backbone.MozuModel.extend({});
    var ProductCustomizationView = Backbone.MozuView.extend({ 
      templateName: 'modules/customizebulb', 
      events: {
            'click .mz-productoptions-option_bulb': 'getimageinfo', 
            'click .mz-customizebulb':'finishfilter'
        },
        getimageinfo:function(e){   
            var prodData = JSON.parse(sessionStorage.custbulb);
            var prodnam = $(e.currentTarget).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("label:first").attr("val");
            var products = _.where(prodData.options, {attributeFQN: prodnam }); 
            var beam = [];
            var filitem = [];
            var filitem1 = [];
            var datfil = [];
            
            var wat = [];
            
            var apival="",prodarr, prodbeam, $target = e.currentTarget;
            var obj=$($target).attr("value");
            var type=$($target).attr("data-proptype"); 

            if(type==="BULBTYPE"){
                 $("#bulbtype").attr("value",obj);  
            }else if(type==="colortemp"){  
                 $("#colortemp").attr("value",obj); 
            }else if(type==="BeamSpread"){  
                 $("#beamspread").attr("value",obj); 
            }else if(type==="wattage"){  
                 $("#wattage").attr("value",obj); 
            } 
            var selmain = $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").text();
            var bulbtype= $("#bulbtype").attr("value");
            var colortemp= $("#colortemp").attr("value");  
            var beamspread= $("#beamspread").attr("value"); 
            var wattage= $("#wattage").attr("value"); 
            var imgsrc=$($target).attr("imgsrc"); 
            
            $(e.currentTarget).parents(".option-container").find(".options").each(function(){
               $(this).removeClass("selectedoption"); 
            });
            $(e.currentTarget).parents(".options").addClass("selectedoption");
            $($target).parents(".option-container").prev().find("img").attr("src",imgsrc);
            if($(window).width() < 768){
                $($target).parents(".option-container").find(".description-mobile").each(function(){
                   $(this).html(""); 
                });
                $($target).parents(".options").find(".description-mobile").html($($target).attr("descrip"));
                $(e.currentTarget).parents(".option-container").find(".options").each(function(){
                   $(this).removeClass("selectedoption"); 
                });
                 $(e.currentTarget).parents(".options").addClass("selectedoption");
            }else{
                $($target).parents(".option-container").next().html($($target).attr("descrip"));
            }
            var dataobj={};
            var currentdata = $($target).parents(".parent_type").attr("id");
            
            $(products[0].values).each(function(i,j){
                if(i===0){
                    prodarr= "(productCode+eq+"+j.value+")";
                }else{
                    prodarr += " or (productCode+eq+"+j.value+")";
                }
                
            });
            //color
            if(currentdata === "BulbType" ){
                
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                //if(colortemp !== ""){
                    $($target).parents(".mz-productoptions-valuecontainer").find('#ColorTemp').css("display","none");
                    $("#colortemp").attr("value",""); 
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").removeClass("selectopt");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#ColorTemp').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
               // }    
                
                //if(beamspread !== ""){
                    $("#beamspread").attr("value","");   
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt"); 
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').css("display","none");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
                //}
                $($target).parents(".customised_view").find(".preloader").show();
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#bulbtypelabel").addClass("selectopt"); 
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+"and(properties.bulbtype+eq+"+bulbtype+")&startIndex=0&pageSize=100").then(function(Res){
                    
                    var filcols, filbeams, listname, seldata;   
                    $(Res.items).each(function(i,j){  
                        filcols = _.where(j.properties, {attributeFQN: "tenant~color-temperature"});  
                        filbeams = _.where(j.properties, {attributeFQN: "tenant~beamspread"}); 
                        if(filcols.length !== 0){
                            if($.inArray(filcols[0].values[0].value, filitem) === -1) filitem.push(filcols[0].values[0].value);
                        }    
                        if(filbeams.length !== 0){
                            if($.inArray(filbeams[0].values[0].value, filitem1) === -1) filitem1.push(filbeams[0].values[0].value);
                        }
                    });
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                        $($target).parents(".customised_view").find(".preloader").hide();
                    }
                    if(filitem.length !== 0){    
                        datfil = filitem;  
                        seldata = "ColorTemp";
                        listname = 'ColorTemperature@DrewVolt';
                    }else if(filitem1.length !== 0){  
                        datfil = filitem1; 
                        seldata = "BeamSpread";
                        listname = 'beamSpread@DrewVolt';
                    }
                    
                    $(datfil).each(function(i,j){ 
                        if(i===0){
                            prodcol= "(properties.Code eq "+j+")";
                        }else{
                            prodcol += " or (properties.Code eq "+j+")";
                        }
                    });
                    
                    Api.get('documentView', {
                        listName: listname,
                        viewName: 'siteBuilder',
                        filter : prodcol 
                        }).then(function(proddata) { 
                            if($(proddata.data.items).length > 0 ){
                                $(proddata.data.items).each(function(i,v){  
                                    $($target).parents(".customizebulb").find('#'+seldata).find("."+v.properties.Code).css("display","block"); 
                                });
                                $($target).parents(".customizebulb").find('#'+seldata).show();
                                $($target).parents(".customised_view").scrollTop($($target).parents(".customizebulb").find('#'+seldata).offset().top);
                            }else{
                                alert("No Products Found. Please Re-Customise Bulb.");
                            }                           
                            $($target).parents(".customised_view").find(".preloader").hide();
                    });
                    
                });
               
            //beamspread    
            }else if(currentdata === "ColorTemp" ){   
                
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                //if(beamspread !== ""){
                    $("#beamspread").attr("value","");   
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html("");
                    $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").removeClass("selectopt"); 
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').css("display","none");
                    $($target).parents(".mz-productoptions-valuecontainer").find('#BeamSpread').find('.option-container').find('.options').each(function(){
                       $(this).css("display","none");
                       $(this).find("input[type='radio']").attr("checked",false);
                    });
                //}
                
                
                if(bulbtype !== "" ){ 
                    apival = "and (properties.bulbtype+eq+"+bulbtype+")";       
                }
                if(colortemp !== "" ){
                    apival += "and (properties.color-temperature+eq+"+colortemp+")";    
                }
                
                $($target).parents(".customised_view").find(".preloader").show();
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+""+apival+"&startIndex=0&pageSize=100").then(function(Res){
                 
                    var filtemp, listname, seldata = $($target).parents(".parent_type").next().attr("id");
                    $(Res.items).each(function(i,j){
                        
                        if(seldata === "BeamSpread"){
                            filtemp = _.where(j.properties, {attributeFQN: "tenant~beamspread"});     
                            listname = 'beamSpread@DrewVolt';
                        }
                        if($.inArray(filtemp[0].values[0].value, filitem) === -1) filitem.push(filtemp[0].values[0].value);
                    });
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                        $($target).parents(".customised_view").find(".preloader").hide();
                    }
                    
                    $(filitem).each(function(i,j){ 
                        if(i===0){
                            prodcol= "(properties.Code eq "+j+")";
                        }else{
                            prodcol += " or (properties.Code eq "+j+")";
                        }
                    });
                    
                    Api.get('documentView', {
                        listName: listname,
                        viewName: 'siteBuilder',
                        filter : prodcol 
                        }).then(function(proddata) { 
                            if($(proddata.data.items).length > 0 ){
                                $(proddata.data.items).each(function(i,v){  
                                    $(document).find(".customizebulb").find('#'+seldata).find("."+v.properties.Code).css("display","block"); 
                                });
                                $($target).parents(".parent_type").next().show();
                                $($target).parents(".customised_view").scrollTop($($target).parents(".parent_type").next().offset().top);
                            }else{
                                alert("No Products Found. Please Re-Customise Bulb.");
                            } 
                            $($target).parents(".customised_view").find(".preloader").hide();
                    });
                    
                });   
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#colortemplabel").addClass("selectopt"); 
                
            //wattage
            }else if(currentdata === "BeamSpread" ){  
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").html("");
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                $($target).parents(".customised_view").next().find("button").attr("disabled","disabled");
                $($target).parents(".customizebulb").next().css("display","none");
                $($target).parents(".customizebulb").next().find('.option-container').find('.options').each(function(){
                   $(this).css("display","none");
                   $(this).find("input[type='radio']").attr("checked",false);
                });
                
                if(bulbtype !== "" ){  
                    apival += "and (properties.bulbtype+eq+"+bulbtype+")";          
                }
                if(colortemp !== "" ){
                    apival += "and (properties.color-temperature+eq+"+colortemp+")";    
                }
                if(beamspread !== "" ){
                    apival += "and (properties.beamspread+eq+"+beamspread+")";
                }
                $($target).parents(".customised_view").find(".preloader").show();
                Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+" "+apival+"&startIndex=0&pageSize=100").then(function(Res){
                    
                    $(Res.items).each(function(i,j){ 
                        $($target).parents(".customizebulb").next().css("display","block");
                        $($target).parents(".customizebulb").next().find("[value='"+j.productCode+"']").parent().css("display","block");
                        $($target).parents(".customised_view").scrollTop($($target).parents(".customizebulb").next().offset().top);
                    });
                    if(Res.items.length === 0){
                        alert("No Products Found. Please Re-Customise Bulb.");
                    }
                    $($target).parents(".customised_view").find(".preloader").hide();
                });
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").html($($target).attr("dispalytxt"));
                $($target).parents(".mz-productoptions-optioncontainer").find(".option-container-heading").find("#BeamSpreadlabel").addClass("selectopt");  
            }
        },
        finishfilter:function(){
                $(document).find(".customizebulb").css("display","none");
                $(document).find(".customizebulb").next().css("display","block");
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
        }
    });
     
   
    function filterdatas(filteredGoal){
        var filobj={};
        var prodarr = [];
        var bulb= [];
        var colortmp= [];
        var beam= [];
        var watag= [];
        
        if(filteredGoal.length >0 ){ 
            if(filteredGoal[0].attributeFQN !== undefined){
                filobj.productopt = filteredGoal[0].attributeFQN;    
            }
    
            $(filteredGoal[0].values).each(function(i,j){
                if(i===0){
                    prodarr= "(productCode+eq+"+j.value+")";
                }else{
                    prodarr += " or (productCode+eq+"+j.value+")";   
                }
                
            });
            Api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?query=&filter="+prodarr+"&startIndex=0&pageSize=100").then(function(Res){
                
                $(Res.items).each(function(i,j){ 
                    var bulbprop = _.where(j.properties, {attributeFQN: "tenant~bulbtype"});
                    var colortemp = _.where(j.properties, {attributeFQN: "tenant~color-temperature"});
                    
                    var beamprop = _.where(j.properties, {attributeFQN: "tenant~beamspread"});
                    var wattage = _.where(j.properties, {attributeFQN: "tenant~wattage"});
                    
                    if(colortemp.length !== 0){
                        if($.inArray(colortemp[0].values[0].value, colortmp) === -1) colortmp.push(colortemp[0].values[0].value);    
                    }
                    if(bulbprop.length !== 0){
                        if($.inArray(bulbprop[0].values[0].value, bulb) === -1) bulb.push(bulbprop[0].values[0].value);
                    }
                    
                    if(beamprop.length !== 0){
                        if($.inArray(beamprop[0].values[0].value, beam) === -1) beam.push(beamprop[0].values[0].value);
                    }
                    
                    if(wattage.length !== 0){
                        if($.inArray(wattage[0].values[0].value, watag) === -1) watag.push(wattage[0].values[0].value);
                    }
                        
                });
                if(bulb.length !== 0){ 
                    filobj.bulbtype = bulb;
                }
                if(colortmp.length !== 0){
                    filobj.colortemp = colortmp;
                }
                if(beam.length !== 0){
                    filobj.beamtype = beam;
                }
                
                if(watag.length !== 0){
                    filobj.wattage = watag; 
                }
                
                calculate(filobj); 
            });
        }
    }
    
     
    function calculate(val){  
        var obj={};
        var prodbulb,colortemp,prodbeam,prodwat;
       
            
        $(val.bulbtype).each(function(i,j){
            if(i===0){
                prodbulb= "(properties.Code eq "+j+")";
            }else{
                prodbulb += " or (properties.Code eq "+j+")";
            }
            
        });       
        $(val.colortemp).each(function(i,j){
            if(i===0){
                colortemp= "(properties.Code eq "+j+")";
            }else{
                colortemp += " or (properties.Code eq "+j+")";
            }
            
        });  
        $(val.beamtype).each(function(i,j){
            if(i===0){
                prodbeam= "(properties.Code eq "+j+")";
            }else{
                prodbeam += " or (properties.Code eq "+j+")";
            }
        }); 
        $(val.wattage).each(function(i,j){
            if(i===0){
                prodwat= "(properties.Code eq "+j+")";
            }else{
                prodwat += " or (properties.Code eq "+j+")";
            }
        });  
        
         Api.get('documentView', { 
            listName: 'BulbType@DrewVolt',
            viewName: 'siteBuilder',
            filter : prodbulb 
                }).then(function(documents) { 
                if(val.bulbtype){
                    obj.BulbType=documents.data.items;      
                }
                Api.get('documentView', { 
                    listName: 'ColorTemperature@DrewVolt',
                    viewName: 'siteBuilder',
                    filter : colortemp 
                        }).then(function(documents) {   
                        if(val.colortemp){
                            obj.colortemp=documents.data.items;  
                        }
                        Api.get('documentView', {
                            listName: 'BeamSpread@DrewVolt',
                            viewName: 'siteBuilder' ,
                            filter : prodbeam 
                            }).then(function(beamspread) {
                                if(val.beamtype){
                                    obj.BeamSpread=beamspread.data.items; 
                                }
                                obj.opt = val.productopt; 
                                
                                renderthecustomview(obj); 
                                
                        });
                });        
        });
   
    }
    
     function renderthecustomview(obj){
         var custoption1 = Hypr.getThemeSetting("singleCustomisedBulbExtra");
        var custoption2 = Hypr.getThemeSetting("TopCustomisedBulbExtra");
        var custoption3 = Hypr.getThemeSetting("BottomCustomisedBulbExtra");
         var productcustomizationview;
          if(obj.opt == custoption2 ){ 
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });  
          }else if(obj.opt == custoption3 ){
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });   
          }else  if(obj.opt == custoption1 ){
            productcustomizationview = new ProductCustomizationView({
                el: $(document).find('[valopt="'+obj.opt+'"]'),
                model: new QOModel(obj)
            });   
          } 
      
            productcustomizationview.render();  
                                         
        }

        var ColorImageCache = {},
            arraydata = [],
            CategoryHeirachyList = {},
            PorjectIndex = 0;
        var projectArray = [];
        $(document).ready(function () {
            if (location.hash.length > 0) {
                if(location.hash.substring(1, location.hash.length) === "tab-5"){
                    $("html, body").animate({
                            scrollTop: $(".rtab-5").offset().top - 200
                        }, "medium");
                    if($(window).width() < 768){
                        setTimeout(function(){  
                            $(".product-detail-tabs").find("a[href='#tab-5']").trigger("click");
                        },3000);
                    }else{
                        $(".rtab-5").find("a").click();
                    }
                }
            } 
            $(document).on("click","#desrating", function(e){
                $("html, body").animate({ 
                    scrollTop: $(".rtab-5").offset().top - 200
                }, "medium");
            }); 
            
            if($(window).width() < 768){
                if($("[itemprop='reviewCount']").text() !== ""){
                    $("#pdpmobilerating").text("("+$("[itemprop='reviewCount']").text()+")");
                } 
                $(document).on("click", ".pdpmobileratelink", function(e){  
                    if(!($(".product-detail-tabs").find("a[href='#tab-5']").parent().hasClass("r-tabs-state-active"))){
                        $(".product-detail-tabs").find("a[href='#tab-5']").trigger("click");
                    }
                    $("html, body").animate({
                        scrollTop: $(".r-tabs-accordion-title").find("a[href='#tab-5']").offset().top - 150
                    }, "medium");
                });
                $(document).on("click", "#writereview_snippet", function(e){
                    if($(document).find(".pr-write-review-link").find("div").length > 0){
                        $(document).find(".pr-write-review-link").find("div").click();       
                    }else{
                        $(document).find(".pr-write-review-link")[0].click();   
                    }    
                });    
            }
            
            var productCode = $('[data-mz-prodtcode]').first().data('mzProdtcode');

            Api.request('GET', '/api/commerce/catalog/storefront/products/' + productCode + '/locationinventory?locationCodes=ALLDC').then(function (response) {

            });

            $('.feature-images').children("span").on('mouseover',function (e) {
                $(this).addClass('on');
                if($(this).children("p").length === 0) {
                    $(this).removeClass('on');
                }
            });

            $(document).on("click", ".prodvideo", function (e) {
              
                var obj = $(e.currentTarget);
                var dtsrc = $(obj).attr("datavideo");
                var newsrc = "http://www.youtube.com/embed/" + dtsrc + "?autoplay=1&showinfo=0&controls=0' frameborder='0' allowfullscreen";
                $(obj).parents(".video-carousel").find(".mz-embedvideo").attr("src", newsrc);
            });
            var pageCntxt = require.mozuData('pagecontext');
            $('body').on('keyup', function (e) {
                if (e.which == 27) {
                    return false;
                }
            });


            var prodinfo = require.mozuData("product");

            var videoresourcehtml = "";
            var mobileResource = "";

            var resourcehtml = "";
            _.each(prodinfo.properties, function (propitm) {

                var sitecontext = require.mozuData('sitecontext');

                var imagefilepath = sitecontext.cdnPrefix + '/cms/' + sitecontext.siteId + '/files';
                if (propitm.attributeFQN.toLowerCase() === "tenant~documents") {
                    if (propitm.values[0] !== undefined) {
                        var documents = propitm.values[0].stringValue;
                        var docarray = documents.split(",");
                        var res = [];
                        for (var i = 0; i < docarray.length; i++) {
                            var index = docarray[i].indexOf(":");
                            var key = docarray[i].substring(0, index);

                            var datakey = docarray[i].substring(index + 1);

                            resourcehtml += "<h3>" + key + "</h3><h4><a href='" + imagefilepath + '/' + datakey + "' target='_blank' title='" + key + "'>" + datakey + "</a></h4>";
                        }

                    }
                }
            });
            $(document).on('click', '.pdp-top-arrow', function (e) {
                $("html, body").animate({
                    scrollTop: "0"
                }, 1000);
            });

            $(document).on('click', '.addtocartfloating', function (e) {
                $(".mz-productdetail-addtocart").trigger("click");
            });
            $(document).on('click', '.customwishlist', function (e) {
                var lengthofmodel = $(".cart-overlay").length;
                if (lengthofmodel === 0) {
                    $(".mz-prdOption").trigger("click");
                }

            });

            if ($(window).width() <= 767) {
                $(document).on('click', '.write-review', function (e) {
                    e.preventDefault();

                    $(".r-tabs-accordion-title").find("a[href='#tab-4']").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-4").offset().top - 200
                    }, "medium");
                });
                $(document).on('click', '.r-tabs-accordion-title', function (e) {
                    e.preventDefault();
                    var post = $(this).offset(),
                        top = post.top - 160;
                    $(window).scrollTop(top);
                    reInitializeOwnlCaraousal();
                });

            } else if (($(window).width() > 768 && $(window).width()) < 979) {
                $(document).on('click', '.fixed > li', function (e) {
                    $(window).scrollTop(900);
                });
            } else {
                $(document).on('click', '.fixed > li', function (e) {
                    $(window).scrollTop(840);
                });
                $(document).on('click', '.write-review', function (e) {
                    e.preventDefault();

                    $(".rtab-4").find("a").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-4").offset().top - 200
                    }, "medium");
                });
            }

            $(document).on('click', '.read-more', function (e) {
                e.preventDefault();
               
                if($(window).width() < 767)
                {
                    $(".r-tabs-accordion-title").find("a[href='#tab-1']").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-1").offset().top - 60
                    }, "medium");
                }
                else
                {
                    $(".rtab-1").find("a").click();
                    $("html, body").animate({
                        scrollTop: $(".rtab-1").offset().top - 200
                    }, "medium");
                }
            });

            function reInitializeOwnlCaraousal(){
                var owl = $(document).find("#tab-6").find(".video-linkcontainer-mobile");
                var x = owl.data('owlCarousel');

                owl.trigger('destroy.owl.carousel');
                owl.html(owl.find('.owl-stage-outer').html()).removeClass('owl-loaded');
                loadVideoGallery();
            }
            //load video gallery

            function loadVideoGallery() { 

                if($(document).find("#tab-6").find(".video-linkcontainer-mobile").children().length > 1){
                    $(document).find("#tab-6").find(".video-linkcontainer-mobile").addClass('owl-carousel').owlCarousel({ 
                        items:1,
                        loop: true, 
                        singleItem:true,
                        nav:true,
                        touchDrag: true,
                        dots: false
                    });
 
                    productView.render();
                }
            }

            //stop youtube video
            function pauseYouTubeVideo(elm) {

            }

            $('#horizontalTab .product-detail-tabs-wrap').responsiveTabs({
                rotate: false,
                startCollapsed: 'accordion',
                collapsible: 'accordion',
                setHash: true,
                disabled: [6, 7],
                activate: function (e, tab) {
                    $('.info').html('Tab <strong>' + tab.id + '</strong> activated!');
                },
                activateState: function (e, state) {
                    $('.info').html('Switched from <strong>' + state.oldState + '</strong> state to <strong>' + state.newState + '</strong> state!');
                }
            });



            

            $('.r-tabs-anchor').on('click', function () {
                if ($(this).attr("href") == "#tab-6") {   
                    videoPreviewGallery();
                }
            });

            if ($('#horizontalTab li.r-tabs-state-active').children('.r-tabs-anchor').attr('href') == "#tab-6") {
                videoPreviewGallery();
            }

            function videoPreviewGallery() {
                if (!$('.video-preview').hasClass('.owl-carousel')) {
                    $('.video-preview').owlCarousel({
                        loop: true,
                        margin: 10,
                        nav: ($('.video-preview').find(".item").length > 3? true: false),
                        items: 3
                    });
                }
            }

            // show/hide Tab menu

            tabMenuShowHide();
            $(window).on('scroll', function () {
                tabMenuShowHide();
            });
            function tabMenuShowHide() {
                var navHeight = $(window).height() - 75;
                if ($(window).width() > 767) {
                    if ($(window).scrollTop() > $('.mz-l-container').height() + 30) {

                        $(".pdp-float-header").fadeIn();
                        $('ul.megaMenuMain').stop(true).fadeOut(300);
                        $('#vt-header').fadeOut(300);

                        if ($('.product-detail-tabs').css('position') !== 'fixed') {
                            $(".product-detail-tabs").fadeOut(function () {
                                $('.product-detail-tabs').addClass('fixed');
                                $(".product-detail-tabs").fadeIn(function () {});
                            });
                        }

                    } else {
                        $(".pdp-float-header").fadeOut();
                        $('.mz-pagefooter').css({
                            'padding-bottom': "0px"
                        });
                        $('ul.megaMenuMain').stop(true).fadeIn(300);
                        $('#vt-header').fadeIn(300);
                        $('#').fadeIn(300);

                        if ($('.product-detail-tabs').css('position') == 'fixed') {
                            $(".product-detail-tabs").fadeOut(function () {
                                $('.product-detail-tabs').removeClass('fixed');
                                $(".product-detail-tabs").fadeIn(function () {});
                            });
                        }
                    }
                }
                else {
                    if ($(document).scrollTop() > $('.mz-l-container').height()) {
                        $(".pdp-float-header").fadeIn();
                        $('.mz-pagefooter').css({
                            'padding-bottom': "80px"
                        });
                    } else {
                        $(".pdp-float-header").fadeOut();
                    }
                }

            }
            function reviewCounts(){
                if($(".pr-snapshot-average-based-on-text").length > 0){
                    $("#pdpmobilerating").text("("+$(".pr-snapshot-average-based-on-text").find("span").text()+")");
                }else{
                    $("#pdpmobilerating").text("(0)"); 
                }
            }
            var product = new ProductModels.Product(prodinfo),
                recentProduct = {
                    code: prodinfo.productCode
                },
                productProperties = product.apiModel.data.properties,
                productcolorimagesstr = "";

            var customizeimgProduct = "",
                customizeimagecachearr = {};
            productProperties = product.apiModel.data.properties;
            for (var index1 = 0; index1 < productProperties.length; index1++) {
                if (productProperties[index1].attributeFQN == "tenant~customizecart" || productProperties[index1].attributeFQN == "Tenant~Customizecart") {
                    for (var val1 in productProperties[index1].values) {
                        customizeimgProduct = $.trim(productProperties[index1].values[val1].stringValue);
                    }
                }
            }

            if (customizeimgProduct !== "") {
                var cutomarr = customizeimgProduct.split(";");
                _.each(cutomarr, function (imgdata) {
                    var customprod = $.trim(imgdata),
                        dataarr = customprod.split(":"),
                        customprodname = dataarr[0],
                        customprodimg = dataarr[1],
                        imagejson = {};
                    imagejson.imageUrl = imagefilepath + '/' + $.trim(customprodimg);
                    customizeimagecachearr[customprodname] = imagejson;
                });
            }
            var t = Api.context.tenant;
            var s = Api.context.site;
            var filepath = ""+require.mozuData("sitecontext").cdnPrefix+"/cms/" + s + "/files/";
            
            // customized add to cart end
            var relatedprojectsHtml = "<h3>Projects Featuring</h3>";
            relatedprojectsHtml += "<h4>"+product.apiModel.data.content.productName+"</h4><ul class='projects-featuring-gallery'>";

            var cde = $('[data-mz-prodtcode]').first().data('mzProdtcode');
            var projarrayy = [];
            var prjid = Hypr.getThemeSetting('Project_Cid');
            Api.request('GET', "/api/commerce/catalog/storefront/productsearch/search/?query=&startIndex=0&pageSize=200&filter=categoryId%20req%20"+prjid).then(function (prjctinfo) {

                var projlength = prjctinfo.items.length;
                var dynamicArrayobj = [];
                var indexar = 0;
                _.each(prjctinfo.items, function (subproductitem, totalloop) {
                    var Projobj = _.findWhere(subproductitem.properties, {
                        attributeFQN: "tenant~products-in-project"
                    });

                    if (Projobj) {

                        indexar++;
                        var tempval = Projobj.values[0].value.replace(/"/g, "").replace("[", "").replace("]", "");

                        var tempArray = tempval.split(",");
                        var flaug = false;
                        for (var i = 0; i < tempArray.length; i++) {
                            if (tempArray[i] == cde) {
                                flaug = true;
                            }
                        }
                        if (flaug) {
                            dynamicArrayobj.push(subproductitem.productCode);
                            flaug = false;
                        }
                    } else {
                        indexar++;
                    }
                    if (indexar == projlength) {

                        for (var iarray = 0; iarray < dynamicArrayobj.length; iarray++) {
                            /* jshint ignore:start */
                            Api.get('product', dynamicArrayobj[iarray]).then(function (productObjecsst) {
                                projarrayy.push(productObjecsst.data);
                                if (projarrayy.length == dynamicArrayobj.length) {

                                    renderobj(projarrayy);
                                }
                            });
                            /* jshint ignore:end */
                        }

                    }

                });

            });

            function renderobj(obj) {

                _.each(obj, function (catdata) {
                    var seourl = (catdata.content.seoFriendlyUrl)?"/"+catdata.content.seoFriendlyUrl+"":"";
                    _.each(catdata.content.productImages, function (catimgdata, index) {
                        if (index === 0) {
                            relatedprojectsHtml += "<li class='products-list-item projects-featuring-gallery-item'> <a href='"+seourl+"/p/" + catdata.productCode + "' class='projects-featuring-gallery-item-inner'><figure class='projects-featuring-gallery-image-wrap'>";
                            if (pageCntxt.isDesktop) {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            } else if (pageCntxt.isMobile) {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            } else {
                                relatedprojectsHtml += "<img class='projects-featuring-gallery-image' src='" + catimgdata.imageUrl + "?max="+require.mozuData("sitecontext").themeSettings.listProductThumbSize+"&quality=" + cdnquality + "' alt='"+catimgdata.altText+"' />";
                            }
                            relatedprojectsHtml += "</figure><h4 class='projects-featuring-gallery-name'>"+catdata.content.productName+"</h4></a></li>";
                        }
                    });
                });
                relatedprojectsHtml += "</ul>";
                relatedprojectsHtml += "<a href='/c/"+require.mozuData("sitecontext").themeSettings.ProjectListing+"' class='projects-featuring-link'>View All Projects</a></div>";

                $('.projects-featuring').append(relatedprojectsHtml);
                //if ($(".projects-featuring-gallery").find("li").length > 3) {
                    /*$(".projects-featuring-gallery").owlCarousel({
                        loop: true,
                        margin: 0,
                        nav: true,
                        dots: false,
                        autoplay: true,
                        items: 4,
                        responsive: {
                            0: {
                                items: 1,
                                nav: true
                            },
                            768: {
                                items: 3,
                            },
                            1025: {
                                items: 4,
                            }
                        },
                    });*/
                    //project featuring gallery

                    $('.projects-featuring-gallery').fadeIn(300);
                    $('.projects-featuring-gallery').owlCarousel({
                        responsive: {
                            1024: {
                                items: 4,
                                nav: ($('.projects-featuring-gallery-item').length <= 4 ? false : true),
                            },
                            768: {
                                items: 2,
                                nav: ($('.projects-featuring-gallery-item').length <= 2 ? false : true),
                            },
                            640: {
                                items: 2,
                                nav: ($('.projects-featuring-gallery-item').length <= 2 ? false : true),
                            },
                            300: {
                                items: 1,
                                nav: ($('.projects-featuring-gallery-item').length <= 1 ? false : true),
                            }
                        },
                        lazyLoad : true,
                        loop: false,
                        dots: false,
                        autoplay: false,
                        showNavPreview: true,
                        addClassActive: true,
                        navThumbImg: false
                    });

               // }



            }

            product.on('addedtocart', function (cartitem) {
                if (cartitem && cartitem.prop('id')) {
                    
                    CartMonitor.updateCart(product.get('quantity'));
                    $(document).find(".product-container").find(".mz-messagebar").html("");
                    if($(window).scrollTop() > $('.mz-l-container').height() + 30) {
                        $('body,html').scrollTop(100);
                    }
                    $('.mz-productdetail-addtocart').removeClass("is-processing");
                    
                    
                } else {
                    product.trigger("error", {
                        message: Hypr.getLabel('unexpectedError')
                    });
                }
                if (($(window).width()) < 768) {
                    //Check is user is valid or not
                    window.location.href = HyprLiveContext.locals.pageContext.secureHost + "/cart";
                }
            });

            product.on('addedtowishlist', function (cartitem) {
                $('#add-to-wishlist').removeClass("is-processing");
                $('#add-to-wishlist').prop('disabled', 'disabled').text(Hypr.getLabel('addedToWishlist'));
            });

            var productView = new ProductView({
                el: $('#product-detail'),
                model: product,
                messagesEl: $('[data-mz-message-bar]')
            });

            var productImagesView = new ProductImageViews.ProductPageImagesView({
                el: $('[data-mz-productimages]'),
                model: product
            });
            window.productView = productView;
            productView.render();
            window.productImagesView = productImagesView;
            productImagesView.render();
            if(Hypr.getThemeSetting('managePowerReview')) window.productImagesView.on('render', reviewCounts);
            $(document).on('click', '.mz-productwishlist', function (e) {
                e.preventDefault();
                $(".mz-wishproductlist").click();
            });
            reviewCounts();
            tabMenuShowHide();
        });
    });


define("pages/product", function(){});
