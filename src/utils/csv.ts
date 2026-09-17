import dayjs from 'dayjs';

// CSV 单元格转义：含逗号/引号/换行时加双引号包裹并加倍内部引号，避免表格内容错位
const escapeCsvCell = (value: unknown): string => {
  const str = String(value ?? '');
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// 导出参数：表头、分页拉取函数、行转数组映射，由各查询页按表格列定义
interface ExportCsvOptions<T> {
  // 下载文件名前缀，自动追加 _YYYYMMDD_HHmmss.csv 时间戳
  fileName: string;
  headers: string[];
  // 分页拉取：pageSize 上限 100，按 total 循环拉取全部数据
  fetchPage: (page: number, pageSize: number) => Promise<{ list: T[]; total: number }>;
  // 行数据转单元格数组（与表格列一致），index 从 0 起（序号列自行 +1）
  rowToLine: (row: T, index: number) => unknown[];
}

// 导出当前筛选条件下的全部数据：按 total 循环分页拉取（pageSize 100），
// 生成带 UTF-8 BOM 的 CSV 文件下载，Excel/WPS 直接打开中文不乱码。
// 4 个查询页（saleQuery/buriedQuery/adminfeeQuery/contactsQuery）原逐字重复的导出逻辑收敛于此 20260914 抽取
export const exportCsv = async <T>(options: ExportCsvOptions<T>): Promise<void> => {
  const { fileName, headers, fetchPage, rowToLine } = options;

  const pageSize = 100;
  const allRows: T[] = [];
  let total = 0;
  let current = 1;
  do {
    const { list, total: resultTotal } = await fetchPage(current, pageSize);
    // push 展开追加，避免每次拼接全量拷贝
    allRows.push(...list);
    total = resultTotal;
    current += 1;
  } while (allRows.length < total);

  const lines = allRows.map((row, index) => rowToLine(row, index).map(escapeCsvCell).join(','));
  const csv = `\uFEFF${headers.map(escapeCsvCell).join(',')}\r\n${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
