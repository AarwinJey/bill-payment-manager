import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Include prefabricated authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type and storage
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Bill management
  var nextBillId = 1;

  type Bill = {
    id : Nat;
    owner : Principal;
    name : Text;
    category : Text;
    amount : Float;
    dueDate : Text;
    status : Text; // "unpaid" or "paid"
    paymentMethod : Text; // "Cash", "Cheque", "UPI"
    chequeNumber : ?Text;
    upiId : ?Text;
    createdAt : Int;
    paidAt : ?Int;
  };

  type PaymentRecord = {
    billId : Nat;
    billName : Text;
    amount : Float;
    paidAt : Int;
  };

  type Summary = {
    totalBills : Nat;
    paidCount : Nat;
    unpaidCount : Nat;
    totalAmountDue : Float;
  };

  let billsMap = Map.empty<Nat, Bill>();
  let paymentHistory = Map.empty<Nat, PaymentRecord>();

  public shared ({ caller }) func createBill(
    name : Text,
    category : Text,
    amount : Float,
    dueDate : Text,
    paymentMethod : Text,
    chequeNumber : ?Text,
    upiId : ?Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bills");
    };

    let billId = nextBillId;
    nextBillId += 1;

    let newBill : Bill = {
      id = billId;
      owner = caller;
      name;
      category;
      amount;
      dueDate;
      status = "unpaid";
      paymentMethod;
      chequeNumber;
      upiId;
      createdAt = Time.now();
      paidAt = null;
    };

    billsMap.add(billId, newBill);
    billId;
  };

  public query ({ caller }) func getBills() : async [Bill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };

    // Users can only see their own bills, admins can see all
    if (AccessControl.isAdmin(accessControlState, caller)) {
      billsMap.values().toArray();
    } else {
      billsMap.values().filter(func(bill) { bill.owner == caller }).toArray();
    };
  };

  public shared ({ caller }) func updateBill(billId : Nat, name : Text, category : Text, amount : Float, dueDate : Text, paymentMethod : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bills");
    };

    switch (billsMap.get(billId)) {
      case (null) {
        false;
      };
      case (?bill) {
        // Users can only update their own bills, admins can update any
        if (bill.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own bills");
        };

        let updatedBill : Bill = {
          id = bill.id;
          owner = bill.owner;
          name;
          category;
          amount;
          dueDate;
          status = bill.status;
          paymentMethod;
          chequeNumber = null;
          upiId = null;
          createdAt = bill.createdAt;
          paidAt = bill.paidAt;
        };

        billsMap.add(billId, updatedBill);
        true;
      };
    };
  };

  public shared ({ caller }) func updateBillStatus(billId : Nat, status : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bill status");
    };

    switch (billsMap.get(billId)) {
      case (null) {
        false;
      };
      case (?bill) {
        // Users can only update their own bills, admins can update any
        if (bill.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own bills");
        };

        let updatedBill : Bill = {
          id = bill.id;
          owner = bill.owner;
          name = bill.name;
          category = bill.category;
          amount = bill.amount;
          dueDate = bill.dueDate;
          status;
          paymentMethod = bill.paymentMethod;
          chequeNumber = bill.chequeNumber;
          upiId = bill.upiId;
          createdAt = bill.createdAt;
          paidAt = if (status == "paid") { ?Time.now() } else { null };
        };

        billsMap.add(billId, updatedBill);
        true;
      };
    };
  };

  public shared ({ caller }) func updateBillStatusWithPayment(
    billId : Nat,
    status : Text,
    chequeNumber : ?Text,
    upiId : ?Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bill status with payment details");
    };

    switch (billsMap.get(billId)) {
      case (null) {
        false;
      };
      case (?bill) {
        // Users can only update their own bills, admins can update any
        if (bill.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own bills");
        };

        let updatedBill : Bill = {
          id = bill.id;
          owner = bill.owner;
          name = bill.name;
          category = bill.category;
          amount = bill.amount;
          dueDate = bill.dueDate;
          status;
          paymentMethod = bill.paymentMethod;
          chequeNumber;
          upiId;
          createdAt = bill.createdAt;
          paidAt = if (status == "paid") { ?Time.now() } else { null };
        };

        billsMap.add(billId, updatedBill);

        // Add payment record to history if bill is paid
        if (status == "paid") {
          let payment : PaymentRecord = {
            billId = bill.id;
            billName = bill.name;
            amount = bill.amount;
            paidAt = Time.now();
          };
          paymentHistory.add(billId, payment);
        };

        true;
      };
    };
  };

  public shared ({ caller }) func deleteBill(billId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete bills");
    };

    switch (billsMap.get(billId)) {
      case (null) {
        false;
      };
      case (?bill) {
        // Users can only delete their own bills, admins can delete any
        if (bill.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own bills");
        };

        billsMap.remove(billId);
        true;
      };
    };
  };

  public query ({ caller }) func getPaymentHistory() : async [PaymentRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };

    // Filter payment records based on bill ownership
    // Admins can see all payment records, users can only see their own
    if (AccessControl.isAdmin(accessControlState, caller)) {
      paymentHistory.values().toArray();
    } else {
      let userPayments = List.empty<PaymentRecord>();
      
      for (record in paymentHistory.values()) {
        // Check if the bill belongs to the caller
        switch (billsMap.get(record.billId)) {
          case (?bill) {
            if (bill.owner == caller) {
              userPayments.add(record);
            };
          };
          case (null) {
            // Bill no longer exists, skip this payment record
          };
        };
      };
      
      userPayments.toArray();
    };
  };

  public query ({ caller }) func getSummary() : async Summary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view summary");
    };

    // Filter bills based on ownership
    let userBills = if (AccessControl.isAdmin(accessControlState, caller)) {
      billsMap.values().toArray();
    } else {
      billsMap.values().filter(func(bill) { bill.owner == caller }).toArray();
    };

    let totalBills = userBills.size();

    let paidCount = userBills.filter(func(bill) { bill.status == "paid" }).size();
    let unpaidCount = userBills.filter(func(bill) { bill.status == "unpaid" }).size();

    var totalAmountDue = 0.0;
    for (bill in userBills.values()) {
      if (bill.status == "unpaid") {
        totalAmountDue += bill.amount;
      };
    };

    {
      totalBills;
      paidCount;
      unpaidCount;
      totalAmountDue;
    };
  };
};
