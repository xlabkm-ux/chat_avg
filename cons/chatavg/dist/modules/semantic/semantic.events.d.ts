export function claimCreated(claim: Object): {
    type: "claim.created";
    claim: Object;
};
export function claimDowngraded(claim: Object, fromStrength: string, toStrength: string, reason: string): {
    type: "claim.downgraded";
    claim: any;
    fromStrength: any;
    toStrength: any;
    reason: any;
};
export function boundaryViolation(claim: Object, boundaryId: string, rule: string, action: string): {
    type: "boundary.violation";
    claim: any;
    boundaryId: any;
    rule: any;
    action: any;
};
export function authorityBlocked(claim: Object, violationType: string): {
    type: "authority.blocked";
    claim: any;
    violationType: any;
};
