;; title: executor-trait
;; description: Trait for executable actions invoked by the treasury vault

(define-trait executor-trait
  (
    ;; execute the action with given parameters
    ;; returns (ok true) on success, or an error code
    (execute (uint) (response bool uint))
  )
)
