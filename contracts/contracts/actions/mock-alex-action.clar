;; title: mock-alex-action
;; description: Mock action that satisfies the executor-trait for Clarinet testing

(impl-trait .executor-trait.executor-trait)

(define-public (execute (amount uint))
  (begin
    ;; In a real implementation, this would call alex-vault or similar protocols
    ;; For MVP mock, it just returns ok
    (ok true)
  )
)
