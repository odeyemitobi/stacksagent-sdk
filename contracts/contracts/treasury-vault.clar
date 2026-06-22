;; title: treasury-vault
;; description: Institutional treasury vault for StackAgent SDK
;; purpose: Holds STX and other assets. Allows the owner to execute transfers.
;; invariants: Only the owner can transfer assets out.
;; trust assumptions: The owner principal is trusted (managed by the off-chain approval queue).

;; security checklist:
;; - [x] tx-sender checks on every state-mutating public function
;; - [x] explicit post-condition compatibility (standard STX transfer used)
;; - [x] trait conformance (N/A for basic vault)
;; - [x] integer overflow/underflow checks (N/A for basic STX transfer)

;; --- Traits ---
(use-trait executor-trait .executor-trait.executor-trait)

;; --- Constants ---
(define-constant err-unauthorized (err u401))
(define-constant err-invalid-amount (err u400))

;; --- Data Variables ---
(define-data-var vault-owner principal tx-sender)

;; --- Public Functions ---

;; @desc Deposit STX into the vault
;; @param amount The amount of STX to deposit
(define-public (deposit-stx (amount uint))
    (begin
        (asserts! (> amount u0) err-invalid-amount)
        (stx-transfer? amount tx-sender (as-contract tx-sender))
    )
)

;; @desc Transfer STX from the vault to a recipient
;; @param amount The amount of STX to transfer
;; @param recipient The principal receiving the STX
(define-public (transfer-stx (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender (var-get vault-owner)) err-unauthorized)
        (asserts! (> amount u0) err-invalid-amount)
        (as-contract (stx-transfer? amount tx-sender recipient))
    )
)

;; @desc Update the vault owner
;; @param new-owner The new owner principal
(define-public (set-owner (new-owner principal))
    (begin
        (asserts! (is-eq tx-sender (var-get vault-owner)) err-unauthorized)
        (ok (var-set vault-owner new-owner))
    )
)

;; @desc Execute an arbitrary DeFi action via the executor trait
;; @param action The contract implementing the executor-trait
;; @param amount The amount of STX or param to pass
(define-public (execute-approved-intent (action <executor-trait>) (amount uint))
    (begin
        (asserts! (is-eq tx-sender (var-get vault-owner)) err-unauthorized)
        (as-contract (contract-call? action execute amount))
    )
)

;; --- Read-Only Functions ---

;; @desc Get the current vault owner
(define-read-only (get-owner)
    (ok (var-get vault-owner))
)

;; @desc Get the current vault STX balance
(define-read-only (get-balance)
    (ok (stx-get-balance (as-contract tx-sender)))
)
