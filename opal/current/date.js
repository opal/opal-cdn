Opal.modules["date"] = function(Opal) {/* Generated by Opal 1.4.1 */
  var $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $klass = Opal.klass, $def = Opal.def, $eqeqeq = Opal.eqeqeq, $to_ary = Opal.to_ary, $send2 = Opal.send2, $find_super = Opal.find_super, $eqeq = Opal.eqeq, $truthy = Opal.truthy, $rb_gt = Opal.rb_gt, $const_set = Opal.const_set, $rb_plus = Opal.rb_plus, $send = Opal.send, $alias = Opal.alias, $rb_minus = Opal.rb_minus, $rb_lt = Opal.rb_lt, $rb_times = Opal.rb_times;

  Opal.add_stubs('include,<=>,attr_reader,nonzero?,d,zero?,new,class,-@,+@,===,coerce,==,>,+,allocate,join,compact,map,to_proc,downcase,wrap,raise,clone,jd,>>,wday,year,month,day,-,to_s,to_i,<,*,reverse,step,abs,each');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Date');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.date = nil;
    
    self.$include($$('Comparable'));
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Infinity');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.d = nil;
      
      self.$include($$('Comparable'));
      
      $def(self, '$initialize', function $$initialize(d) {
        var self = this;

        
        
        if (d == null) d = 1;;
        return (self.d = d['$<=>'](0));
      }, -1);
      self.$attr_reader("d");
      
      $def(self, '$zero?', function $Infinity_zero$ques$1() {
        
        return false
      }, 0);
      
      $def(self, '$finite?', function $Infinity_finite$ques$2() {
        
        return false
      }, 0);
      
      $def(self, '$infinite?', function $Infinity_infinite$ques$3() {
        var self = this;

        return self.$d()['$nonzero?']()
      }, 0);
      
      $def(self, '$nan?', function $Infinity_nan$ques$4() {
        var self = this;

        return self.$d()['$zero?']()
      }, 0);
      
      $def(self, '$abs', function $$abs() {
        var self = this;

        return self.$class().$new()
      }, 0);
      
      $def(self, '$-@', function $Infinity_$minus$$5() {
        var self = this;

        return self.$class().$new(self.$d()['$-@']())
      }, 0);
      
      $def(self, '$+@', function $Infinity_$plus$$6() {
        var self = this;

        return self.$class().$new(self.$d()['$+@']())
      }, 0);
      
      $def(self, '$<=>', function $Infinity_$lt_eq_gt$7(other) {
        var $a, $b, self = this, $ret_or_1 = nil, l = nil, r = nil;

        if ($eqeqeq($$('Infinity'), ($ret_or_1 = other))) {
          return self.$d()['$<=>'](other.$d())
        } else if ($eqeqeq($$('Numeric'), $ret_or_1)) {
          return self.$d()
        } else {
          
          try {
            
            $b = other.$coerce(self), $a = $to_ary($b), (l = ($a[0] == null ? nil : $a[0])), (r = ($a[1] == null ? nil : $a[1])), $b;
            return l['$<=>'](r);
          } catch ($err) {
            if (Opal.rescue($err, [$$('NoMethodError')])) {
              try {
                return nil
              } finally { Opal.pop_exception(); }
            } else { throw $err; }
          };
        }
      }, 1);
      
      $def(self, '$coerce', function $$coerce(other) {
        var $yield = $$coerce.$$p || nil, self = this, $ret_or_1 = nil;

        delete $$coerce.$$p;
        if ($eqeqeq($$('Numeric'), ($ret_or_1 = other))) {
          return [self.$d()['$-@'](), self.$d()]
        } else {
          return $send2(self, $find_super(self, 'coerce', $$coerce, false, true), 'coerce', [other], $yield)
        }
      }, 1);
      return $def(self, '$to_f', function $$to_f() {
        var self = this;

        
        if ($eqeq(self.d, 0)) {
          return 0
        };
        if ($truthy($rb_gt(self.d, 0))) {
          return $$$($$('Float'), 'INFINITY')
        } else {
          return $$$($$('Float'), 'INFINITY')['$-@']()
        };
      }, 0);
    })($nesting[0], $$('Numeric'), $nesting);
    $const_set($nesting[0], 'JULIAN', $$('Infinity').$new());
    $const_set($nesting[0], 'GREGORIAN', $$('Infinity').$new()['$-@']());
    $const_set($nesting[0], 'ITALY', 2299161);
    $const_set($nesting[0], 'ENGLAND', 2361222);
    $const_set($nesting[0], 'MONTHNAMES', $rb_plus([nil], ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]));
    $const_set($nesting[0], 'ABBR_MONTHNAMES', ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]);
    $const_set($nesting[0], 'DAYNAMES', ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    $const_set($nesting[0], 'ABBR_DAYNAMES', ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$wrap', function $$wrap(native$) {
        var self = this, instance = nil;

        
        instance = self.$allocate();
        instance.date = native$;
        return instance;
      }, 1);
      
      $def(self, '$parse', function $$parse(string, comp) {
        var self = this;

        
        
        if (comp == null) comp = true;;
        
        var current_date = new Date();

        var current_day = current_date.getDate(),
            current_month = current_date.getMonth(),
            current_year = current_date.getFullYear(),
            current_wday = current_date.getDay(),
            full_month_name_regexp = $$('MONTHNAMES').$compact().$join("|");

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
            return $$('ABBR_MONTHNAMES').indexOf(abbr) + 1;
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
                wday = $send($$('DAYNAMES'), 'map', [], "downcase".$to_proc()).indexOf((dayname).$downcase());

            return current_day - current_wday + wday;
          }
        }

        // Converts passed month name to a month number
        function fromFullMonthName(fn) {
          return function(match) {
            var month_name = fn(match);
            return $send($$('MONTHNAMES').$compact(), 'map', [], "downcase".$to_proc()).indexOf((month_name).$downcase()) + 1;
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
            regexp: new RegExp("^(" + $$('DAYNAMES').$join("|") + ")$", 'i'),
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
        return self.$raise($$('ArgumentError'), "invalid date");
      }, -2);
      
      $def(self, '$today', function $$today() {
        var self = this;

        return self.$wrap(new Date())
      }, 0);
      
      $def(self, '$gregorian_leap?', function $gregorian_leap$ques$8(year) {
        
        return (new Date(year, 1, 29).getMonth()-1) === 0
      }, 1);
      return $alias(self, "civil", "new");
    })(Opal.get_singleton_class(self), $nesting);
    
    $def(self, '$initialize', function $$initialize(year, month, day, start) {
      var self = this;

      
      
      if (year == null) year = -4712;;
      
      if (month == null) month = 1;;
      
      if (day == null) day = 1;;
      
      if (start == null) start = $$('ITALY');;
      
      // Because of Gregorian reform calendar goes from 1582-10-04 to 1582-10-15.
      // All days in between end up as 4 october.
      if (year === 1582 && month === 10 && day > 4 && day < 15) {
        day = 4;
      }
    ;
      return (self.date = new Date(year, month - 1, day));
    }, -1);
    
    $def(self, '$-', function $Date_$minus$9(date) {
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
        self.$raise($$('TypeError'));
      }
    
    }, 1);
    
    $def(self, '$+', function $Date_$plus$10(date) {
      var self = this;

      
      if (date.$$is_number) {
        var result = self.$clone();
        result.date.setDate(self.date.getDate() + date);
        return result;
      }
      else {
        self.$raise($$('TypeError'));
      }
    
    }, 1);
    
    $def(self, '$<', function $Date_$lt$11(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a < b;
    
    }, 1);
    
    $def(self, '$<=', function $Date_$lt_eq$12(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a <= b;
    
    }, 1);
    
    $def(self, '$>', function $Date_$gt$13(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a > b;
    
    }, 1);
    
    $def(self, '$>=', function $Date_$gt_eq$14(other) {
      var self = this;

      
      var a = self.date, b = other.date;
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      return a >= b;
    
    }, 1);
    
    $def(self, '$<=>', function $Date_$lt_eq_gt$15(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.$jd()['$<=>'](other)
      }

      if ($$('Date')['$==='](other)) {
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
    
    }, 1);
    
    $def(self, '$>>', function $Date_$gt$gt$16(n) {
      var self = this;

      
      if (!n.$$is_number) {
        self.$raise($$('TypeError'));
      }

      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + n);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    
    }, 1);
    
    $def(self, '$<<', function $Date_$lt$lt$17(n) {
      var self = this;

      
      if (!n.$$is_number) {
        self.$raise($$('TypeError'));
      }

      return self['$>>'](-n);
    
    }, 1);
    
    $def(self, '$clone', function $$clone() {
      var self = this;

      return $$('Date').$wrap(new Date(self.date.getTime()))
    }, 0);
    
    $def(self, '$day', function $$day() {
      var self = this;

      return self.date.getDate()
    }, 0);
    
    $def(self, '$friday?', function $Date_friday$ques$18() {
      var self = this;

      return self.$wday()['$=='](5)
    }, 0);
    
    $def(self, '$jd', function $$jd() {
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
    
    }, 0);
    
    $def(self, '$julian?', function $Date_julian$ques$19() {
      var self = this;

      return self.date < new Date(1582, 10 - 1, 15, 12)
    }, 0);
    
    $def(self, '$monday?', function $Date_monday$ques$20() {
      var self = this;

      return self.$wday()['$=='](1)
    }, 0);
    
    $def(self, '$month', function $$month() {
      var self = this;

      return self.date.getMonth() + 1
    }, 0);
    
    $def(self, '$next', function $$next() {
      var self = this;

      return $rb_plus(self, 1)
    }, 0);
    
    $def(self, '$next_day', function $$next_day(n) {
      var self = this;

      
      
      if (n == null) n = 1;;
      return $rb_plus(self, n);
    }, -1);
    
    $def(self, '$next_month', function $$next_month(n) {
      var self = this;

      
      
      if (n == null) n = 1;;
      
      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + n);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    ;
    }, -1);
    
    $def(self, '$next_year', function $$next_year(years) {
      var self = this;

      
      
      if (years == null) years = 1;;
      return self.$class().$new($rb_plus(self.$year(), years), self.$month(), self.$day());
    }, -1);
    
    $def(self, '$prev_day', function $$prev_day(n) {
      var self = this;

      
      
      if (n == null) n = 1;;
      return $rb_minus(self, n);
    }, -1);
    
    $def(self, '$prev_month', function $$prev_month(n) {
      var self = this;

      
      
      if (n == null) n = 1;;
      
      var result = self.$clone(), date = result.date, cur = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() - n);
      date.setDate(Math.min(cur, days_in_month(date.getFullYear(), date.getMonth())));
      return result;
    ;
    }, -1);
    
    $def(self, '$prev_year', function $$prev_year(years) {
      var self = this;

      
      
      if (years == null) years = 1;;
      return self.$class().$new($rb_minus(self.$year(), years), self.$month(), self.$day());
    }, -1);
    
    $def(self, '$saturday?', function $Date_saturday$ques$21() {
      var self = this;

      return self.$wday()['$=='](6)
    }, 0);
    
    $def(self, '$strftime', function $$strftime(format) {
      var self = this;

      
      
      if (format == null) format = "";;
      
      if (format == '') {
        return self.$to_s();
      }

      return self.date.$strftime(format);
    ;
    }, -1);
    
    $def(self, '$sunday?', function $Date_sunday$ques$22() {
      var self = this;

      return self.$wday()['$=='](0)
    }, 0);
    
    $def(self, '$thursday?', function $Date_thursday$ques$23() {
      var self = this;

      return self.$wday()['$=='](4)
    }, 0);
    
    $def(self, '$to_s', function $$to_s() {
      var self = this;

      
      var d = self.date, year = d.getFullYear(), month = d.getMonth() + 1, day = d.getDate();
      if (month < 10) { month = '0' + month; }
      if (day < 10) { day = '0' + day; }
      return year + '-' + month + '-' + day;
    
    }, 0);
    
    $def(self, '$to_time', function $$to_time() {
      var self = this;

      return $$('Time').$new(self.$year(), self.$month(), self.$day())
    }, 0);
    
    $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.date
    }, 0);
    
    $def(self, '$tuesday?', function $Date_tuesday$ques$24() {
      var self = this;

      return self.$wday()['$=='](2)
    }, 0);
    
    $def(self, '$step', function $$step(limit, step) {
      var block = $$step.$$p || nil, self = this, steps_count = nil, steps = nil, result = nil;

      delete $$step.$$p;
      
      ;
      
      if (step == null) step = 1;;
      steps_count = $rb_minus(limit, self).$to_i();
      steps = ($truthy($rb_lt($rb_times(steps_count, step), 0)) ? ([]) : ($truthy($rb_lt(steps_count, 0)) ? ($send(Opal.Range.$new(0, steps_count['$-@'](), false).$step(step.$abs()), 'map', [], "-@".$to_proc()).$reverse()) : (Opal.Range.$new(0, steps_count, false).$step(step.$abs()))));
      result = $send(steps, 'map', [], function $$25(i){var self = $$25.$$s == null ? this : $$25.$$s;

        
        
        if (i == null) i = nil;;
        return $rb_plus(self, i);}, {$$arity: 1, $$s: self});
      if ((block !== nil)) {
        
        $send(result, 'each', [], function $$26(i){
          
          
          if (i == null) i = nil;;
          return Opal.yield1(block, i);;}, 1);
        return self;
      } else {
        return result
      };
    }, -2);
    
    $def(self, '$upto', function $$upto(max) {
      var block = $$upto.$$p || nil, self = this;

      delete $$upto.$$p;
      
      ;
      return $send(self, 'step', [max, 1], block.$to_proc());
    }, 1);
    
    $def(self, '$downto', function $$downto(min) {
      var block = $$downto.$$p || nil, self = this;

      delete $$downto.$$p;
      
      ;
      return $send(self, 'step', [min, -1], block.$to_proc());
    }, 1);
    
    $def(self, '$wday', function $$wday() {
      var self = this;

      return self.date.getDay()
    }, 0);
    
    $def(self, '$wednesday?', function $Date_wednesday$ques$27() {
      var self = this;

      return self.$wday()['$=='](3)
    }, 0);
    
    $def(self, '$year', function $$year() {
      var self = this;

      return self.date.getFullYear()
    }, 0);
    
    $def(self, '$cwday', function $$cwday() {
      var self = this;

      return self.date.getDay() || 7
    }, 0);
    
    $def(self, '$cweek', function $$cweek() {
      var self = this;

      
      var d = new Date(self.date);
      d.setHours(0,0,0);
      d.setDate(d.getDate()+4-(d.getDay()||7));
      return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
    
    }, 0);
    
    function days_in_month(year, month) {
      var leap = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
      return [31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
    }
  ;
    $alias(self, "eql?", "==");
    return $alias(self, "succ", "next");
  })($nesting[0], null, $nesting)
};
