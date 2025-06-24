export const TABLE_NAME = 'MRP.SED_CONTRACT_CELL_AMC'
export const DB_NAME = 'MRP'

export const QUERY =
  'select t.ROWID, SL, DESCR_OF_WRK,WO_NO,WO_DT,NAME_OF_CONTRACTOR	,VALUE_OF_CONTRACT,	DT_OF_COMMENCE,	DT_OF_COMPLETION,	MODE_OF_PAYMENT,	AREA_INCHRG, INCHRG_PBNUM,	CONTRACTOR_PH_NO, FILE_TRACK_REF_NO, EXECUTION_DTL,IS_RECURRING,	STATUS,	REMARKS1,	TENDR_DUE_EDC,	PAID_AMT, CAT ,SUB_CAT, DIVISION,AAR_DATE	,DEPT,UPDATED_DATE,UPDATED_BY,ESTIMATED_VALUE,ADMIN_APPROVAL_RECT_DATE,TENDER_NO,TENDER_DATE,TENDER_TYPE,DATE_OF_TENDER_OPENING,BID_VLIDITY,TEC_APPROVED_DATE,COMMERCIAL_BID_OPENING_DATE,AWARD_OF_WORK_APPROVAL_DATE from MRP.SED_CONTRACT_CELL_AMC t'

export const FIELDS = [
  { text: 'SL', value: 'SL', type: 'text', no: { delete: true } },
  {
    text: 'DIV',
    value: 'DIV',
    type: 'select',
    options_query: [
      { KEY: 'ED', VAL: 'ED' },
      { KEY: 'SED', VAL: 'SED' },
    ],
    no: { delete: true },
  },
  {
    text: 'CATEGORY',
    value: 'CATEGORY',
    type: 'select',
    options_query: [
      { KEY: 'Works', VAL: 'Works' },
      { KEY: 'Services', VAL: 'Services' },
      { KEY: 'Miscellaneous', VAL: 'Miscelaneous' },
    ],
    no: { delete: true },
  },
  { text: 'DESCR', value: 'DESCR_OF_WRK', type: 'text', no: { delete: true } },
  { text: 'WO_NO', value: 'WO_NO', type: 'text', no: { delete: true } },
  { text: 'WO_DT', value: 'WO_DT', type: 'date', no: {} },
  { text: 'NAME_OF_CONTRACTOR', value: 'NAME_OF_CONTRACTOR', type: 'text', no: {} },
  { text: 'VALUE_OF_CONTRACT', value: 'VALUE_OF_CONTRACT', type: 'number', no: {} },
  { text: 'DT_OF_COMMENCE', value: 'DT_OF_COMMENCE', type: 'date', no: {} },
  { text: 'DT_OF_COMPLETION', value: 'DT_OF_COMPLETION', type: 'date', no: {} },
  { text: 'MODE_OF_PAYMENT', value: 'MODE_OF_PAYMENT', type: 'text', no: {} },
  { text: 'AREA_INCHRG', value: 'AREA_INCHRG', type: 'text', no: {} },
  { text: 'INCHRG_PBNUM', value: 'INCHRG_PBNUM', type: 'text', no: {} },
  { text: 'CONTRACTOR_PH_NO', value: 'CONTRACTOR_PH_NO', type: 'text', no: {} },
  { text: 'FILE_TRACK_REF_NO', value: 'FILE_TRACK_REF_NO', type: 'text', no: {} },
  {
    text: 'EXECUTION_DTL',
    value: 'EXECUTION_DTL',
    type: 'select',
    options_query: [
      { KEY: 'WORK IN PROGRESS', VAL: 'WORK IN PROGRESS' },
      { KEY: 'WORK COMPLETED', VAL: 'WORK COMPLETED' },
    ],
    no: {},
  },
  { text: 'IS_RECURRING', value: 'IS_RECURRING', type: 'boolean', no: {} },
  {
    text: 'STATUS',
    value: 'STATUS',
    type: 'select',
    options_query: [
      { KEY: 'TO BE TENDERED', VAL: 'TO BE TENDERED' },
      { KEY: 'WORK ORDER ISSUED', VAL: 'WORK ORDER ISSUED' },
      { KEY: 'WO CLOSED', VAL: 'WO CLOSED' },
    ],
    no: {},
  },
  { text: 'REMARKS1', value: 'REMARKS1', type: 'text', no: {} },
  { text: 'TENDR_DUE_EDC', value: 'TENDR_DUE_EDC', type: 'date', no: {} },
  { text: 'PAID_AMT', value: 'PAID_AMT', type: 'number', no: {} },
  { text: 'CAT', value: 'CAT', type: 'text', no: {} },
  { text: 'SUB_CAT', value: 'SUB_CAT', type: 'text', no: {} },
  { text: 'DIVISION', value: 'DIVISION', type: 'text', no: {} },
  { text: 'AAR_DATE', value: 'AAR_DATE', type: 'date', no: {} },
  { text: 'DEPT', value: 'DEPT', type: 'text', no: {} },
  { text: 'UPDATED_DATE', value: 'UPDATED_DATE', type: 'date', no: {} },
  { text: 'UPDATED_BY', value: 'UPDATED_BY', type: 'text', no: {} },
  { text: 'ESTIMATED_VALUE', value: 'ESTIMATED_VALUE', type: 'number', no: {} },
  { text: 'ADMIN_APPROVAL_RECT_DATE', value: 'ADMIN_APPROVAL_RECT_DATE', type: 'date', no: {} },
  { text: 'TENDER_NO', value: 'TENDER_NO', type: 'text', no: {} },
  { text: 'TENDER_DATE', value: 'TENDER_DATE', type: 'date', no: {} },
  { text: 'TENDER_TYPE', value: 'TENDER_TYPE', type: 'text', no: {} },
  { text: 'DATE_OF_TENDER_OPENING', value: 'DATE_OF_TENDER_OPENING', type: 'text', no: {} },
  { text: 'BID_VLIDITY', value: 'BID_VLIDITY', type: 'text', no: {} },
  { text: 'TEC_APPROVED_DATE', value: 'TEC_APPROVED_DATE', type: 'date', no: {} },
  {
    text: 'COMMERCIAL_BID_OPENING_DATE',
    value: 'COMMERCIAL_BID_OPENING_DATE',
    type: 'date',
    no: {},
  },
  {
    text: 'AWARD_OF_WORK_APPROVAL_DATE',
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
