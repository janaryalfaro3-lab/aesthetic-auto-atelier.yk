# Security Specification - Aesthetic Auto Atelier

## Data Invariants
1. A booking cannot be created without a valid full name, phone number, and service.
2. The `price` must be a string starting with the peso sign (₱).
3. The `status` must be 'pending' upon creation.
4. `createdAt` must match the server timestamp.

## The "Dirty Dozen" Payloads
1. **Empty Payload**: Attempt to create booking with `{}`. -> **DENIED**
2. **Missing required fields**: Create booking without `phone`. -> **DENIED**
3. **Invalid type**: `phone` as a number. -> **DENIED**
4. **Invalid email**: `email` as string "not-an-email". -> **DENIED**
5. **Evil ID Injection**: String > 1MB in location. -> **DENIED**
6. **Bypass status**: Create booking with `status: 'confirmed'`. -> **DENIED**
7. **Spoof timestamp**: Create booking with `createdAt` set to a date in 2000. -> **DENIED**
8. **Malicious ID prefix**: Document ID with junk characters. -> **DENIED** - Handled by `isValidId`.
9. **Public Read**: Attempt to list all bookings. -> **DENIED**
10. **Public Delete**: Attempt to delete a booking. -> **DENIED**
11. **Public Update**: Attempt to update any field after creation. -> **DENIED**
12. **Huge Strings**: 1MB string in `fullName`. -> **DENIED**

## Test Runner
A `firestore.rules.test.ts` would be implemented here using `@firebase/rules-unit-testing`.
