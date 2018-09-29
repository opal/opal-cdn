/* Generated by Opal 0.11.3 */
Opal.modules["date"] = function(Opal) {
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$include', '$<=>', '$nonzero?', '$d', '$zero?', '$new', '$class', '$-@', '$+@', '$===', '$coerce', '$==', '$>', '$+', '$allocate', '$join', '$compact', '$map', '$to_proc', '$downcase', '$wrap', '$raise', '$clone', '$jd', '$>>', '$wday', '$-', '$to_s', '$alias_method', '$to_i', '$<', '$*', '$reverse', '$step', '$abs', '$each']);
  return (function($base, $super, $parent_nesting) {
    function $Date(){};
    var self = $Date = $klass($base, $super, 'Date', $Date);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Date_initialize_17, TMP_Date_$_18, TMP_Date_$_19, TMP_Date_$lt_20, TMP_Date_$lt$eq_21, TMP_Date_$gt_22, TMP_Date_$gt$eq_23, TMP_Date_$lt$eq$gt_24, TMP_Date_$gt$gt_25, TMP_Date_$lt$lt_26, TMP_Date_clone_27, TMP_Date_day_28, TMP_Date_friday$q_29, TMP_Date_jd_30, TMP_Date_julian$q_31, TMP_Date_monday$q_32, TMP_Date_month_33, TMP_Date_next_34, TMP_Date_next_day_35, TMP_Date_next_month_36, TMP_Date_prev_day_37, TMP_Date_prev_month_38, TMP_Date_saturday$q_39, TMP_Date_strftime_40, TMP_Date_sunday$q_41, TMP_Date_thursday$q_42, TMP_Date_to_s_43, TMP_Date_tuesday$q_44, TMP_Date_step_45, TMP_Date_upto_49, TMP_Date_downto_50, TMP_Date_wday_51, TMP_Date_wednesday$q_52, TMP_Date_year_53, TMP_Date_cwday_54, TMP_Date_cweek_55;

    def.date = nil;
    
    self.$include(Opal.const_get_relative($nesting, 'Comparable'));
    (function($base, $super, $parent_nesting) {
      function $Infinity(){};
      var self = $Infinity = $klass($base, $super, 'Infinity', $Infinity);

      var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Infinity_initialize_1, TMP_Infinity_d_2, TMP_Infinity_zero$q_3, TMP_Infinity_finite$q_4, TMP_Infinity_infinite$q_5, TMP_Infinity_nan$q_6, TMP_Infinity_abs_7, TMP_Infinity_$$_8, TMP_Infinity_$$_9, TMP_Infinity_$lt$eq$gt_10, TMP_Infinity_coerce_11, TMP_Infinity_to_f_12;

      def.d = nil;
      
      self.$include(Opal.const_get_relative($nesting, 'Comparable'));
      
      Opal.defn(self, '$initialize', TMP_Infinity_initialize_1 = function $$initialize(d) {
        var self = this;

        if (d == null) {
          d = 1;
        }
        return (self.d = d['$<=>'](0))
      }, TMP_Infinity_initialize_1.$$arity = -1);
      
      Opal.defn(self, '$d', TMP_Infinity_d_2 = function $$d() {
        var self = this;

        return self.d
      }, TMP_Infinity_d_2.$$arity = 0);
      
      Opal.defn(self, '$zero?', TMP_Infinity_zero$q_3 = function() {
        var self = this;

        return false
      }, TMP_Infinity_zero$q_3.$$arity = 0);
      
      Opal.defn(self, '$finite?', TMP_Infinity_finite$q_4 = function() {
        var self = this;

        return false
      }, TMP_Infinity_finite$q_4.$$arity = 0);
      
      Opal.defn(self, '$infinite?', TMP_Infinity_infinite$q_5 = function() {
        var self = this;

        return self.$d()['$nonzero?']()
      }, TMP_Infinity_infinite$q_5.$$arity = 0);
      
      Opal.defn(self, '$nan?', TMP_Infinity_nan$q_6 = function() {
        var self = this;

        return self.$d()['$zero?']()
      }, TMP_Infinity_nan$q_6.$$arity = 0);
      
      Opal.defn(self, '$abs', TMP_Infinity_abs_7 = function $$abs() {
        var self = this;

        return self.$class().$new()
      }, TMP_Infinity_abs_7.$$arity = 0);
      
      Opal.defn(self, '$-@', TMP_Infinity_$$_8 = function() {
        var self = this;

        return self.$class().$new(self.$d()['$-@']())
      }, TMP_Infinity_$$_8.$$arity = 0);
      
      Opal.defn(self, '$+@', TMP_Infinity_$$_9 = function() {
        var self = this;

        return self.$class().$new(self.$d()['$+@']())
      }, TMP_Infinity_$$_9.$$arity = 0);
      
      Opal.defn(self, '$<=>', TMP_Infinity_$lt$eq$gt_10 = function(other) {
        var $a, $b, self = this, $case = nil, l = nil, r = nil;

        
        $case = other;
        if (Opal.const_get_relative($nesting, 'Infinity')['$===']($case)) {return self.$d()['$<=>'](other.$d())}
        else if (Opal.const_get_relative($nesting, 'Numeric')['$===']($case)) {return self.$d()}
        else {
        try {
          
          $b = other.$coerce(self), $a = Opal.to_ary($b), (l = ($a[0] == null ? nil : $a[0])), (r = ($a[1] == null ? nil : $a[1])), $b;
          return l['$<=>'](r);
        } catch ($err) {
          if (Opal.rescue($err, [Opal.const_get_relative($nesting, 'NoMethodError')])) {
            try {
              nil
            } finally { Opal.pop_exception() }
          } else { throw $err; }
        };};
        return nil;
      }, TMP_Infinity_$lt$eq$gt_10.$$arity = 1);
      
      Opal.defn(self, '$coerce', TMP_Infinity_coerce_11 = function $$coerce(other) {
        var self = this, $iter = TMP_Infinity_coerce_11.$$p, $yield = $iter || nil, $case = nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

        if ($iter) TMP_Infinity_coerce_11.$$p = null;
        // Prepare super implicit arguments
        for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
          $zuper[$zuper_i] = arguments[$zuper_i];
        }
        return (function() {$case = other;
        if (Opal.const_get_relative($nesting, 'Numeric')['$===']($case)) {return [self.$d()['$-@'](), self.$d()]}
        else {return $send(self, Opal.find_super_dispatcher(self, 'coerce', TMP_Infinity_coerce_11, false), $zuper, $iter)}})()
      }, TMP_Infinity_coerce_11.$$arity = 1);
      return (Opal.defn(self, '$to_f', TMP_Infinity_to_f_12 = function $$to_f() {
        var self = this;

        
        if (self.d['$=='](0)) {
          return 0};
        if ($truthy($rb_gt(self.d, 0))) {
          return Opal.const_get_qualified(Opal.const_get_relative($nesting, 'Float'), 'INFINITY')
          } else {
          return Opal.const_get_qualified(Opal.const_get_relative($nesting, 'Float'), 'INFINITY')['$-@']()
        };
      }, TMP_Infinity_to_f_12.$$arity = 0), nil) && 'to_f';
    })($nesting[0], Opal.const_get_relative($nesting, 'Numeric'), $nesting);
    Opal.const_set($nesting[0], 'JULIAN', Opal.const_get_relative($nesting, 'Infinity').$new());
    Opal.const_set($nesting[0], 'GREGORIAN', Opal.const_get_relative($nesting, 'Infinity').$new()['$-@']());
    Opal.const_set($nesting[0], 'ITALY', 2299161);
    Opal.const_set($nesting[0], 'ENGLAND', 2361222);
    Opal.const_set($nesting[0], 'MONTHNAMES', $rb_plus([nil], ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]));
    Opal.const_set($nesting[0], 'ABBR_MONTHNAMES', ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]);
    Opal.const_set($nesting[0], 'DAYNAMES', ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    Opal.const_set($nesting[0], 'ABBR_DAYNAMES', ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    (function(self, $parent_nesting) {
      var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_wrap_13, TMP_parse_14, TMP_today_15, TMP_gregorian_leap$q_16;

      
      Opal.alias(self, "civil", "new");
      
      Opal.defn(self, '$wrap', TMP_wrap_13 = function $$wrap(native$) {
        var self = this, instance = nil;

        
        instance = self.$allocate();
        instance.date = native$;
        return instance;
      }, TMP_wrap_13.$$arity = 1);
      
      Opal.defn(self, '$parse', TMP_parse_14 = function $$parse(string, comp) {
        var self = this;

        if (comp == null) {
          comp = true;
        }
        
        
        var current_date = new Date();

        var current_day = current_date.getDate(),
            current_month = current_date.getMonth(),
            current_year = current_date.getFullYear(),
            current_wday = current_date.getDay(),
            full_month_name_regexp = Opal.const_get_relative($nesting, 'MONTHNAMES').$compact().$join("|");

        function match1(match) { return match[1]; }
        function match2(match) { return match[2]; }
        function match3(match) { return match[3]; }
        function match4(match) { return match[4]; }

        // Converts passed short year (0..99)
        // to a 4-digits year in the range (1969..2068)
        function fromShortYear(fn) {
          return function(match) {
            var short_year = fn(match);

            if (short_year >= 69) {
              short_year += 1900;
            } else {
              short_year += 2000;
            }
            return short_year;
          }
        }

        // Converts month abbr (nov) to a month number
        function fromMonthAbbr(fn) {
          return function(match) {
            var abbr = fn(match).toLowerCase();
            return Opal.const_get_relative($nesting, 'ABBR_MONTHNAMES').indexOf(abbr) + 1;
          }
        }

        function toInt(fn) {
          return function(match) {
            var value = fn(match);
            return parseInt(value, 10);
          }
        }

        // Depending on the 'comp' value appends 20xx to a passed year
        function to2000(fn) {
          return function(match) {
            var value = fn(match);
            if (comp) {
              return value + 2000;
            } else {
              return value;
            }
          }
        }

        // Converts passed week day name to a day number
        function fromDayName(fn) {
          return function(match) {
            var dayname = fn(match),
                wday = $send(Opal.const_get_relative($nesting, 'DAYNAMES'), 'map', [], "downcase".$to_proc()).indexOf((dayname).$downcase());

            return current_day - current_wday + wday;
          }
        }

        // Converts passed month name to a month number
        function fromFullMonthName(fn) {
          return function(match) {
            var month_name = fn(match);
            return $send(Opal.const_get_relative($nesting, 'MONTHNAMES').$compact(), 'map', [], "downcase".$to_proc()).indexOf((month_name).$downcase()) + 1;
          }
        }

        var rules = [
          {
            // DD as month day number
            regexp: /^(\d{2})$/,
            year: current_year,
            month: current_month,
            day: toInt(match1)
          },
          {
            // DDD as year day number
            regexp: /^(\d{3})$/,
            year: current_year,
            month: 0,
            day: toInt(match1)
          },
          {
            // MMDD as month and day
            regexp: /^(\d{2})(\d{2})$/,
            year: current_year,
            month: toInt(match1),
            day: toInt(match2)
          },
          {
            // YYDDD as year and day number in 1969--2068
            regexp: /^(\d{2})(\d{3})$/,
            year: fromShortYear(toInt(match1)),
            month: 0,
            day: toInt(match2)
          },
          {
            // YYMMDD as year, month and day in 1969--2068
            regexp: /^(\d{2})(\d{2})(\d{2})$/,
            year: fromShortYear(toInt(match1)),
            month: toInt(match2),
            day: toInt(match3)
          },
          {
            // YYYYDDD as year and day number
            regexp: /^(\d{4})(\d{3})$/,
            year: toInt(match1),
            month: 0,
            day: toInt(match2)
          },
          {
            // YYYYMMDD as year, month and day number
            regexp: /^(\d{4})(\d{2})(\d{2})$/,
            year: toInt(match1),
            month: toInt(match2),
            day: toInt(match3)
          },
          {
            // mmm YYYY
            regexp: /^([a-z]{3})[\s\.\/\-](\d{3,4})$/,
            year: toInt(match2),
            month: fromMonthAbbr(match1),
            day: 1
          },
          {
            // DD mmm YYYY
            regexp: /^(\d{1,2})[\s\.\/\-]([a-z]{3})[\s\.\/\-](\d{3,4})$/i,
            year: toInt(match3),
            month: fromMonthAbbr(match2),
            day: toInt(match1)
          },
          {
            // mmm DD YYYY
            regexp: /^([a-z]{3})[\s\.\/\-](\d{1,2})[\s\.\/\-](\d{3,4})$/i,
            year: toInt(match3),
            month: fromMonthAbbr(match1),
            day: toInt(match2)
          },
          {
            // YYYY mmm DD
            regexp: /^(\d{3,4})[\s\.\/\-]([a-z]{3})[\s\.\/\-](\d{1,2})$/i,
            year: toInt(match1),
            month: fromMonthAbbr(match2),
            day: toInt(match3)
          },
          {
            // YYYY-MM-DD YYYY/MM/DD YYYY.MM.DD
            regexp: /^(\-?\d{3,4})[\s\.\/\-](\d{1,2})[\s\.\/\-](\d{1,2})$/,
            year: toInt(match1),
            month: toInt(match2),
            day: toInt(match3)
          },
          {
            // YY-MM-DD
            regexp: /^(\d{2})[\s\.\/\-](\d{1,2})[\s\.\/\-](\d{1,2})$/,
            year: to2000(toInt(match1)),
            month: toInt(match2),
            day: toInt(match3)
          },
          {
            // DD-MM-YYYY
            regexp: /^(\d{1,2})[\s\.\/\-](\d{1,2})[\s\.\/\-](\-?\d{3,4})$/,
            year: toInt(match3),
            month: toInt(match2),
            day: toInt(match1)
          },
          {
            // ddd
            regexp: new RegExp("^(" + Opal.const_get_relative($nesting, 'DAYNAMES').$join("|") + ")$", 'i'),
            year: current_year,
            month: current_month,
            day: fromDayName(match1)
          },
          {
            // monthname daynumber YYYY
            regexp: new RegExp("^(" + full_month_name_regexp + ")[\\s\\.\\/\\-](\\d{1,2})(th|nd|rd)[\\s\\.\\/\\-](\\-?\\d{3,4})$", "i"),
            year: toInt(match4),
            month: fromFullMonthName(match1),
            day: toInt(match2)
          },
          {
            // monthname daynumber
            regexp: new RegExp("^(" + full_month_name_regexp + ")[\\s\\.\\/\\-](\\d{1,2})(th|nd|rd)", "i"),
            year: current_year,
            month: fromFullMonthName(match1),
            day: toInt(match2)
          },
          {
            // daynumber monthname YYYY
            regexp: new RegExp("^(\\d{1,2})(th|nd|rd)[\\s\\.\\/\\-](" + full_month_name_regexp + ")[\\s\\.\\/\\-](\\-?\\d{3,4})$", "i"),
            year: toInt(match4),
            month: fromFullMonthName(match3),
            day: toInt(match1)
          },
          {
            // YYYY monthname daynumber
            regexp: new RegExp("^(\\-?\\d{3,4})[\\s\\.\\/\\-](" + full_month_name_regexp + ")[\\s\\.\\/\\-](\\d{1,2})(th|nd|rd)$", "i"),
            year: toInt(match1),
            month: fromFullMonthName(match2),
            day: toInt(match3)
          }
        ]

        var rule, i, match;

        for (i = 0; i < rules.length; i++) {
          rule = rules[i];
          match = rule.regexp.exec(string);
          if (match) {
            var year = rule.year;
            if (typeof(year) === 'function') {
              year = year(match);
            }

            var month = rule.month;
            if (typeof(month) === 'function') {
              month = month(match) - 1
            }

            var day = rule.day;
            if (typeof(day) === 'function') {
              day = day(match);
            }

            var result = new Date(year, month, day);

            // an edge case, JS can't handle 'new Date(1)', minimal year is 1970
            if (year >= 0 && year <= 1970) {
              result.setFullYear(year);
            }

            return self.$wrap(result);
          }
        }
      ;
        return self.$raise(Opal.const_get_relative($nesting, 'ArgumentError'), "invalid date");
      }, TMP_parse_14.$$arity = -2);
      
      Opal.defn(self, '$today', TMP_today_15 = function $$today() {
        var self = this;

        return self.$wrap(new Date())
      }, TMP_today_15.$$arity = 0);
      return (Opal.defn(self, '$gregorian_leap?', TMP_gregorian_leap$q_16 = function(year) {
        var self = this;

        return (new Date(year, 1, 29).getMonth()-1) === 0
      }, TMP_gregorian_leap$q_16.$$arity = 1), nil) && 'gregorian_leap?';
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.defn(self, '$initialize', TMP_Date_initialize_17 = function $$initialize(year, month, day, start) {
      var self = this;

      if (year == null) {
        year = -4712;
      }
      if (month == null) {
        month = 1;
      }
      if (day == null) {
        day = 1;
      }
      if (start == null) {
        start = Opal.const_get_relative($nesting, 'ITALY');
      }
      return (self.date = new Date(year, month - 1, day))
    }, TMP_Date_initialize_17.$$arity = -1);
    
    Opal.defn(self, '$-', TMP_Date_$_18 = function(date) {
      var self = this;

      
      if (date.$$is_number) {
        var result = self.$clone();
        result.date.setDate(self.date.getDate() - date);
        return result;
      }
      else if (date.date) {
        return Math.round((self.date - date.date) / (1000 * 60 * 60 * 24));
      }
      else {
        self.$raise(Opal.const_get_relative($nesting, 'TypeError'));
      }
    
    }, TMP_Date_$_18.$$arity = 1);
    
    Opal.defn(self, '$+', TMP_Date_$_19 = function(date) {
      var self = this;

      
      if (date.$$is_number) {
        var result = self.$clone();
        result.date.setDate(self.date.getDate() + date);
        return result;
      }
      else {
        self.$raise(Opal.const_get_relative($nesting, 'TypeError'));
      }
    
    }, TMP_Date_$_19.$$arity = 1);
    
    Opal.defn(self, '$<', TMP_Date_$lt_20 = function(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a < b;
    
    }, TMP_Date_$lt_20.$$arity = 1);
    
    Opal.defn(self, '$<=', TMP_Date_$lt$eq_21 = function(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a <= b;
    
    }, TMP_Date_$lt$eq_21.$$arity = 1);
    
    Opal.defn(self, '$>', TMP_Date_$gt_22 = function(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a > b;
    
    }, TMP_Date_$gt_22.$$arity = 1);
    
    Opal.defn(self, '$>=', TMP_Date_$gt$eq_23 = function(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a >= b;
    
    }, TMP_Date_$gt$eq_23.$$arity = 1);
    
    Opal.defn(self, '$<=>', TMP_Date_$lt$eq$gt_24 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.$jd()['$<=>'](other)
      }

      if (Opal.const_get_relative($nesting, 'Date')['$==='](other)) {
        var a = self.date, b = other.date;
        a.setHours(0, 0, 0, 0);
        b.setHours(0, 0, 0, 0);

        if (a < b) {
          return -1;
        }
        else if (a > b) {
          return 1;
        }
        else {
          return 0;
        }
      } else {
        return nil;
      }
    
    }, TMP_Date_$lt$eq$gt_24.$$arity = 1);
    
    Opal.defn(self, '$>>', TMP_Date_$gt$gt_25 = function(n) {
      var self = this;

      
      if (!n.$$is_number) {
        self.$raise(Opal.const_get_relative($nesting, 'TypeError'));
      }

      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + n);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    
    }, TMP_Date_$gt$gt_25.$$arity = 1);
    
    Opal.defn(self, '$<<', TMP_Date_$lt$lt_26 = function(n) {
      var self = this;

      
      if (!n.$$is_number) {
        self.$raise(Opal.const_get_relative($nesting, 'TypeError'));
      }

      return self['$>>'](-n);
    
    }, TMP_Date_$lt$lt_26.$$arity = 1);
    Opal.alias(self, "eql?", "==");
    
    Opal.defn(self, '$clone', TMP_Date_clone_27 = function $$clone() {
      var self = this;

      return Opal.const_get_relative($nesting, 'Date').$wrap(new Date(self.date.getTime()))
    }, TMP_Date_clone_27.$$arity = 0);
    
    Opal.defn(self, '$day', TMP_Date_day_28 = function $$day() {
      var self = this;

      return self.date.getDate()
    }, TMP_Date_day_28.$$arity = 0);
    
    Opal.defn(self, '$friday?', TMP_Date_friday$q_29 = function() {
      var self = this;

      return self.$wday()['$=='](5)
    }, TMP_Date_friday$q_29.$$arity = 0);
    
    Opal.defn(self, '$jd', TMP_Date_jd_30 = function $$jd() {
      var self = this;

      
    //Adapted from http://www.physics.sfasu.edu/astro/javascript/julianday.html

    var mm = self.date.getMonth() + 1,
        dd = self.date.getDate(),
        yy = self.date.getFullYear(),
        hr = 12, mn = 0, sc = 0,
        ggg, s, a, j1, jd;

    hr = hr + (mn / 60) + (sc/3600);

    ggg = 1;
    if (yy <= 1585) {
      ggg = 0;
    }

    jd = -1 * Math.floor(7 * (Math.floor((mm + 9) / 12) + yy) / 4);

    s = 1;
    if ((mm - 9) < 0) {
      s =- 1;
    }

    a = Math.abs(mm - 9);
    j1 = Math.floor(yy + s * Math.floor(a / 7));
    j1 = -1 * Math.floor((Math.floor(j1 / 100) + 1) * 3 / 4);

    jd = jd + Math.floor(275 * mm / 9) + dd + (ggg * j1);
    jd = jd + 1721027 + 2 * ggg + 367 * yy - 0.5;
    jd = jd + (hr / 24);

    return jd;
    
    }, TMP_Date_jd_30.$$arity = 0);
    
    Opal.defn(self, '$julian?', TMP_Date_julian$q_31 = function() {
      var self = this;

      return self.date < new Date(1582, 10 - 1, 15, 12)
    }, TMP_Date_julian$q_31.$$arity = 0);
    
    Opal.defn(self, '$monday?', TMP_Date_monday$q_32 = function() {
      var self = this;

      return self.$wday()['$=='](1)
    }, TMP_Date_monday$q_32.$$arity = 0);
    
    Opal.defn(self, '$month', TMP_Date_month_33 = function $$month() {
      var self = this;

      return self.date.getMonth() + 1
    }, TMP_Date_month_33.$$arity = 0);
    
    Opal.defn(self, '$next', TMP_Date_next_34 = function $$next() {
      var self = this;

      return $rb_plus(self, 1)
    }, TMP_Date_next_34.$$arity = 0);
    
    Opal.defn(self, '$next_day', TMP_Date_next_day_35 = function $$next_day(n) {
      var self = this;

      if (n == null) {
        n = 1;
      }
      return $rb_plus(self, n)
    }, TMP_Date_next_day_35.$$arity = -1);
    
    Opal.defn(self, '$next_month', TMP_Date_next_month_36 = function $$next_month() {
      var self = this;

      
      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    
    }, TMP_Date_next_month_36.$$arity = 0);
    
    Opal.defn(self, '$prev_day', TMP_Date_prev_day_37 = function $$prev_day(n) {
      var self = this;

      if (n == null) {
        n = 1;
      }
      return $rb_minus(self, n)
    }, TMP_Date_prev_day_37.$$arity = -1);
    
    Opal.defn(self, '$prev_month', TMP_Date_prev_month_38 = function $$prev_month() {
      var self = this;

      
      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() - 1);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    
    }, TMP_Date_prev_month_38.$$arity = 0);
    
    Opal.defn(self, '$saturday?', TMP_Date_saturday$q_39 = function() {
      var self = this;

      return self.$wday()['$=='](6)
    }, TMP_Date_saturday$q_39.$$arity = 0);
    
    Opal.defn(self, '$strftime', TMP_Date_strftime_40 = function $$strftime(format) {
      var self = this;

      if (format == null) {
        format = "";
      }
      
      if (format == '') {
        return self.$to_s();
      }

      return self.date.$strftime(format);
    
    }, TMP_Date_strftime_40.$$arity = -1);
    self.$alias_method("succ", "next");
    
    Opal.defn(self, '$sunday?', TMP_Date_sunday$q_41 = function() {
      var self = this;

      return self.$wday()['$=='](0)
    }, TMP_Date_sunday$q_41.$$arity = 0);
    
    Opal.defn(self, '$thursday?', TMP_Date_thursday$q_42 = function() {
      var self = this;

      return self.$wday()['$=='](4)
    }, TMP_Date_thursday$q_42.$$arity = 0);
    
    Opal.defn(self, '$to_s', TMP_Date_to_s_43 = function $$to_s() {
      var self = this;

      
      var d = self.date, year = d.getFullYear(), month = d.getMonth() + 1, day = d.getDate();
      if (month < 10) { month = '0' + month; }
      if (day < 10) { day = '0' + day; }
      return year + '-' + month + '-' + day;
    
    }, TMP_Date_to_s_43.$$arity = 0);
    
    Opal.defn(self, '$tuesday?', TMP_Date_tuesday$q_44 = function() {
      var self = this;

      return self.$wday()['$=='](2)
    }, TMP_Date_tuesday$q_44.$$arity = 0);
    
    Opal.defn(self, '$step', TMP_Date_step_45 = function $$step(limit, step) {
      var TMP_46, TMP_47, TMP_48, self = this, $iter = TMP_Date_step_45.$$p, block = $iter || nil, steps_count = nil, steps = nil, result = nil;

      if (step == null) {
        step = 1;
      }
      if ($iter) TMP_Date_step_45.$$p = null;
      
      steps_count = $rb_minus(limit, self).$to_i();
      if ($truthy($rb_lt($rb_times(steps_count, step), 0))) {
        steps = []
      } else if ($truthy($rb_lt(steps_count, 0))) {
        steps = $send(Opal.Range.$new(0, steps_count['$-@'](), false).$step(step.$abs()), 'map', [], (TMP_46 = function(i){var self = TMP_46.$$s || this;
if (i == null) i = nil;
        return i['$-@']()}, TMP_46.$$s = self, TMP_46.$$arity = 1, TMP_46)).$reverse()
        } else {
        steps = Opal.Range.$new(0, steps_count, false).$step(step.$abs())
      };
      result = $send(steps, 'map', [], (TMP_47 = function(i){var self = TMP_47.$$s || this;
if (i == null) i = nil;
      return $rb_plus(self, i)}, TMP_47.$$s = self, TMP_47.$$arity = 1, TMP_47));
      if ((block !== nil)) {
        
        $send(result, 'each', [], (TMP_48 = function(i){var self = TMP_48.$$s || this;
if (i == null) i = nil;
        return Opal.yield1(block, i);}, TMP_48.$$s = self, TMP_48.$$arity = 1, TMP_48));
        return self;
        } else {
        return result
      };
    }, TMP_Date_step_45.$$arity = -2);
    
    Opal.defn(self, '$upto', TMP_Date_upto_49 = function $$upto(max) {
      var self = this, $iter = TMP_Date_upto_49.$$p, block = $iter || nil;

      if ($iter) TMP_Date_upto_49.$$p = null;
      return $send(self, 'step', [max, 1], block.$to_proc())
    }, TMP_Date_upto_49.$$arity = 1);
    
    Opal.defn(self, '$downto', TMP_Date_downto_50 = function $$downto(min) {
      var self = this, $iter = TMP_Date_downto_50.$$p, block = $iter || nil;

      if ($iter) TMP_Date_downto_50.$$p = null;
      return $send(self, 'step', [min, -1], block.$to_proc())
    }, TMP_Date_downto_50.$$arity = 1);
    
    Opal.defn(self, '$wday', TMP_Date_wday_51 = function $$wday() {
      var self = this;

      return self.date.getDay()
    }, TMP_Date_wday_51.$$arity = 0);
    
    Opal.defn(self, '$wednesday?', TMP_Date_wednesday$q_52 = function() {
      var self = this;

      return self.$wday()['$=='](3)
    }, TMP_Date_wednesday$q_52.$$arity = 0);
    
    Opal.defn(self, '$year', TMP_Date_year_53 = function $$year() {
      var self = this;

      return self.date.getFullYear()
    }, TMP_Date_year_53.$$arity = 0);
    
    Opal.defn(self, '$cwday', TMP_Date_cwday_54 = function $$cwday() {
      var self = this;

      return self.date.getDay() || 7;
    }, TMP_Date_cwday_54.$$arity = 0);
    
    Opal.defn(self, '$cweek', TMP_Date_cweek_55 = function $$cweek() {
      var self = this;

      
      var d = new Date(self.date);
      d.setHours(0,0,0);
      d.setDate(d.getDate()+4-(d.getDay()||7));
      return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
    
    }, TMP_Date_cweek_55.$$arity = 0);
    
    function days_in_month(year, month) {
      var leap = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
      return [31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
    }
  ;
  })($nesting[0], null, $nesting)
};
