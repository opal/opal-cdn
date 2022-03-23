# frozen_string_literal: true

require 'opal/nodes/base'

module Opal
  module Nodes
    class NextNode < Base
      handle :next

      def compile
        if in_while?
          push 'continue;'
        elsif scope.iter?
          push 'return ', expr_or_nil(value), ';'
        else
          error 'Invalid next'
        end
      end

      def value
        case children.size
        when 0
          s(:nil)
        when 1
          children.first
        else
          s(:array, *children)
        end
      end
    end

    class BreakNode < Base
      handle :break

      children :value

      def compile
        if in_while?
          compile_while
        elsif scope.iter?
          compile_iter
        else
          error 'void value expression: cannot use break outside of iter/while'
        end
      end

      def compile_while
        if while_loop[:closure]
          push 'return ', expr_or_nil(value)
        else
          push 'break;'
        end
      end

      def compile_iter
        error 'break must be used as a statement' unless stmt?

        line 'Opal.brk(', break_val, ', $brk)'
      end

      def break_val
        if value.nil?
          expr(s(:nil))
        else
          expr(value)
        end
      end
    end

    class RedoNode < Base
      handle :redo

      def compile
        if in_while?
          compile_while
        elsif scope.iter?
          compile_iter
        else
          push 'REDO()'
        end
      end

      def compile_while
        while_loop[:use_redo] = true
        push "#{while_loop[:redo_var]} = true; continue;"
      end

      def compile_iter
        helper :slice
        push "return #{scope.identity}.apply(null, $slice.call(arguments))"
      end
    end

    class SplatNode < Base
      handle :splat

      children :value

      def empty_splat?
        value == s(:array)
      end

      def compile
        if empty_splat?
          push '[]'
        else
          helper :to_a
          push '$to_a(', recv(value), ')'
        end
      end
    end


    class ReturnNode < Base
      handle :return

      children :value

      def return_val
        if value.nil?
          expr(s(:nil))
        elsif children.size > 1
          expr(s(:array, *children))
        else
          expr(value)
        end
      end

      def return_in_iter?
        if (scope.iter? && !scope.lambda?) && parent_def = scope.find_parent_def
          parent_def
        end
      end

      def return_expr_in_def?
        return scope if expr? && (scope.def? || scope.lambda?)
      end

      def scope_to_catch_return
        return_in_iter? || return_expr_in_def?
      end

      def compile
        if def_scope = scope_to_catch_return
          def_scope.catch_return = true
          push 'Opal.ret(', return_val, ')'
        elsif stmt?
          push 'return ', return_val
        else
          error 'void value expression: cannot return as an expression'
        end
      end
    end

    class JSReturnNode < Base
      handle :js_return

      children :value

      def compile
        push 'return '
        push expr(value)
      end
    end

    class JSTempNode < Base
      handle :js_tmp

      children :value

      def compile
        push value.to_s
      end
    end

    class BlockPassNode < Base
      handle :block_pass

      children :value

      def compile
        push expr(s(:send, value, :to_proc, s(:arglist)))
      end
    end
  end
end
