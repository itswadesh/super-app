export const TABLE_NAME = 'MRP.SED_CONTRACT_CELL_AMC'
export const DB_NAME = 'MRP'

export const QUERY =
  'select t.ROWID, SL, DESCR_OF_WRK,WO_NO,WO_DT,NAME_OF_CONTRACTOR	,VALUE_OF_CONTRACT,	DT_OF_COMMENCE,	DT_OF_COMPLETION,	MODE_OF_PAYMENT,	AREA_INCHRG, INCHRG_PBNUM,	CONTRACTOR_PH_NO, FILE_TRACK_REF_NO, EXECUTION_DTL,IS_RECURRING,	STATUS,	REMARKS1,	TENDR_DUE_EDC,	PAID_AMT, CAT ,SUB_CAT, DIVISION,AAR_DATE	,DEPT,UPDATED_DATE,UPDATED_BY,ESTIMATED_VALUE,ADMIN_APPROVAL_RECT_DATE,TENDER_NO,TENDER_DATE,TENDER_TYPE,DATE_OF_TENDER_OPENING,BID_VLIDITY,TEC_APPROVED_DATE,COMMERCIAL_BID_OPENING_DATE,AWARD_OF_WORK_APPROVAL_DATE from MRP.SED_CONTRACT_CELL_AMC t'

export const FIELDS = [
  { text: 'SL', value: 'SL', type: 'text', no: { delete: true } },
  {
    text: 'DIVISION',
    value: 'DIVISION',
    type: 'select',
    options_query: [
      { KEY: 'ED', VAL: 'ED' },
      { KEY: 'SED', VAL: 'SED' },
    ],
    no: { delete: true },
  },
  {
    text: 'CIVIL/PM',
    value: 'DEPT',
    type: 'select',
    options_query: [
      { KEY: 'CIVIL', VAL: 'CIVIL' },
      { KEY: 'PM', VAL: 'PM' },
    ],
    no: {},
  },
  {
    text: 'CATEGORY',
    value: 'CAT',
    type: 'select',
    options_query: [
      { KEY: 'Works', VAL: 'Works' },
      { KEY: 'SERVICES', VAL: 'SERVICES' },
      { KEY: 'Miscellaneous', VAL: 'Miscelaneous' },
    ],
    no: { delete: true },
  },
  {
    text: 'TYPE',
    value: 'SUB_CAT',
    type: 'select',
    options_query: [
      { KEY: 'AMC', VAL: 'AMC' },
      { KEY: 'Capital', VAL: 'Capital' },
      { KEY: 'Job Contract', VAL: 'Job Contract' },
      { KEY: 'Revenue', VAL: 'Revenue' },
      { KEY: 'Expenditure', VAL: 'Expenditure' },
      { KEY: 'Miscellaneous', VAL: 'Miscelaneous' },
    ],
    no: {},
  },
  { text: 'DESCR', value: 'DESCR_OF_WRK', type: 'text', no: { delete: true } },
  { text: 'WO NO', value: 'WO_NO', type: 'text', no: { delete: true } },
  { text: 'WO DATE', value: 'WO_DT', type: 'date', no: {} },
  { text: 'NAME OF CONTRACTOR', value: 'NAME_OF_CONTRACTOR', type: 'text', no: {} },
  { text: 'VALUE OF CONTRACT', value: 'VALUE_OF_CONTRACT', type: 'number', no: {} },
  { text: 'DATE OF COMMENCE', value: 'DT_OF_COMMENCE', type: 'date', no: {} },
  { text: 'DATE OF COMPLETION', value: 'DT_OF_COMPLETION', type: 'date', no: {} },
  { text: 'MODE OF PAYMENT', value: 'MODE_OF_PAYMENT', type: 'text', no: {} },
  { text: 'AREA INCHRG', value: 'AREA_INCHRG', type: 'text', no: {} },
  { text: 'INCHARGE PB NUMBER', value: 'INCHRG_PBNUM', type: 'text', no: {} },
  { text: 'CONTRACTOR PH NO', value: 'CONTRACTOR_PH_NO', type: 'text', no: {} },
  {
    text: 'STATUS',
    value: 'STATUS',
    type: 'select',
    options_query: [
      { KEY: 'TO BE TENDERED', VAL: 'TO BE TENDERED' },
      { KEY: 'UNDER RE-TENDERING APPROVAL', VAL: 'UNDER RE-TENDERING APPROVAL' },
      { KEY: 'TENDER DUE FOR OPENING', VAL: 'TENDER DUE FOR OPENING' },
      { KEY: 'UNDER TECHNICAL EVALUATION', VAL: 'UNDER TECHNICAL EVALUATION' },
      { KEY: 'UNDER PRICE BID OPENING APPROVAL', VAL: 'UNDER PRICE BID OPENING APPROVAL' },
      { KEY: 'UNDER CST', VAL: 'UNDER CST' },
      { KEY: 'UNDER PNC', VAL: 'UNDER PNC' },
      { KEY: 'UNDER AWARDING', VAL: 'UNDER AWARDING' },
      { KEY: 'WORK ORDER ISSUED', VAL: 'WORK ORDER ISSUED' },
      { KEY: 'UNDER FUND APPROVAL AT MC', VAL: 'UNDER FUND APPROVAL AT MC' },
      { KEY: 'KEPT ON HOLD', VAL: 'KEPT ON HOLD' },
    ],
    no: {},
  },

  { text: 'TENDER EDC', value: 'TENDR_DUE_EDC', type: 'date', no: {} },

  { text: 'ADMIN APPROVAL RECEIVE DATE', value: 'AAR_DATE', type: 'date', no: {} },
  // { text: 'UPDATE DATE', value: 'UPDATED_DATE', type: 'date', no: {} },

  { text: 'AMOUNT PAID', value: 'PAID_AMT', type: 'number', no: {} },
  { text: 'FILE TRACK REF NO', value: 'FILE_TRACK_REF_NO', type: 'text', no: {} },
  {
    text: 'EXECUTION STATUS',
    value: 'EXECUTION_DTL',
    type: 'select',
    options_query: [
      { KEY: 'WORK IN PROGRESS', VAL: 'WORK IN PROGRESS' },
      { KEY: 'WORK COMPLETED', VAL: 'WORK COMPLETED' },
    ],
    no: {},
  },
  {
    text: 'IS RECURRING?',
    value: 'IS_RECURRING',
    type: 'select',
    options_query: [
      { KEY: 'Y', VAL: 'Y' },
      { KEY: 'N', VAL: 'N' },
    ],
    no: {},
  },
  { text: 'REMARKS', value: 'REMARKS1', type: 'text', no: {} },
  { text: 'ESTIMATED VALUE', value: 'ESTIMATED_VALUE', type: 'number', no: {} },
  {
    text: 'ADMIN APPROVAL RECTIFICATION DATE',
    value: 'ADMIN_APPROVAL_RECT_DATE',
    type: 'date',
    no: {},
  },
  { text: 'TENDER NO', value: 'TENDER_NO', type: 'text', no: {} },
  { text: 'TENDER DATE', value: 'TENDER_DATE', type: 'date', no: {} },
  { text: 'TENDER TYPE', value: 'TENDER_TYPE', type: 'text', no: {} },
  { text: 'DATE OF TENDER OPENING', value: 'DATE_OF_TENDER_OPENING', type: 'date', no: {} },
  { text: 'BID VALIDITY', value: 'BID_VLIDITY', type: 'text', no: {} },
  { text: 'TEC APPROVED DATE', value: 'TEC_APPROVED_DATE', type: 'date', no: {} },
  {
    text: 'COMMERCIAL BID OPENING DATE',
    value: 'COMMERCIAL_BID_OPENING_DATE',
    type: 'date',
    no: {},
  },
  {
    text: 'AWARD OF WORK APPROVAL DATE',
    value: 'AWARD_OF_WORK_APPROVAL_DATE',
    type: 'date',
    no: {},
  },

  // civil/pm type

  // {
  // 	text: 'EMP_ABBR/CONTRACT DETAILS',
  // 	value: 'EMP_ABBR',
  // 	type: 'select',
  // 	options_query: `SELECT replace(replace(REPLACE(T.ORDER_NO||'/'||INITCAP(IFSAPP.SUPPLIER_INFO_API.Get_Name(t.vendor_no)), ' ', ''), '.', ''), '&', '') KEY, replace(replace(replace(T.ORDER_NO||'/'||INITCAP(IFSAPP.SUPPLIER_INFO_API.Get_Name(t.vendor_no)), ' ', ''), '.', ''), '&', '') VAL FROM IFSAPP.PURCHASE_ORDER_TAB@IFSSED T
  // 		WHERE T.ORDER_DATE > '01-APR-2018' AND ifsapp.pre_accounting_api.get_codeno_h@IFSSED(ifsapp.purchase_order_api.Get_Pre_Accounting_Id@IFSSED(t.ORDER_NO)) = '97-21'`,
  // 	no: { delete: true }
  // }
]
