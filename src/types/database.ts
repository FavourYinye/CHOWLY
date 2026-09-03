export interface MenuItem {
    menu_item_id: string;
    item_name: string;
    price: number;
    prep_time_minutes: number;
    menu_id: string;
  }
  
  export interface Employee {
    employee_id: string;
    employee_name: string;
    employee_role_id: string;
    role_name?: string;
  }
  
  export interface Order {
    order_id: string;
    customer_id: string;
    restaurant_id: string;
    order_datetime: string;
    estimated_waiting_time: number;
    order_status: 'Submitted' | 'Assigned' | 'Preparing' | 'Ready' | 'Served' | 'Completed';
    is_paid: boolean;
  }