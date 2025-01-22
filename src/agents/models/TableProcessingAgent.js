import { TableAgent } from '../base/Agent';
import * as XLSX from 'xlsx';

export class TableProcessingAgent extends TableAgent {
  constructor(config) {
    super(config);
    this.requiredColumns = config.requiredColumns || [
      '订单编号',
      '订单日期',
      '供应商名称',
      '采购物品',
      '规格型号',
      '计量单位',
      '数量',
      '单价',
      '总金额'
    ];
  }

  async parseTable(file) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      return await this.validateData(jsonData);
    } catch (error) {
      throw new Error(`Failed to parse table: ${error.message}`);
    }
  }

  async validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid table data: empty or not an array');
    }

    // 检查必需字段
    const firstRow = data[0];
    const currentColumns = Object.keys(firstRow);

    const missingColumns = this.requiredColumns.filter(
      requiredCol => !currentColumns.some(
        currentCol => currentCol.includes(requiredCol) ||
          this._normalizeColumnName(currentCol).includes(this._normalizeColumnName(requiredCol))
      )
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return this.transformData(data);
  }

  async transformData(data) {
    return data.map(row => {
      // 确保数值字段为数字类型
      const transformedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = this._normalizeColumnName(key);
        if (normalizedKey.includes('数量')) {
          transformedRow[key] = parseInt(value) || 0;
        } else if (normalizedKey.includes('单价') || normalizedKey.includes('金额')) {
          transformedRow[key] = parseFloat(value) || 0;
        } else if (normalizedKey.includes('日期')) {
          transformedRow[key] = this._formatDate(value);
        } else {
          transformedRow[key] = value;
        }
      });

      return {
        ...transformedRow,
        _processed: true,
        _calculatedTotal: (transformedRow['数量'] || 0) * (transformedRow['单价'] || 0)
      };
    });
  }

  _normalizeColumnName(name) {
    return name.toLowerCase()
      .replace(/[\s\-_]/g, '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  _formatDate(date) {
    if (!date) return '';

    try {
      if (typeof date === 'string') {
        // 处理字符串日期
        if (date.includes('/')) {
          const [day, month, year] = date.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else if (date.includes('-')) {
          return date; // 已经是正确格式
        }
      } else if (date instanceof Date) {
        // 处理日期对象
        return date.toISOString().split('T')[0];
      }

      // 尝试转换数字(Excel序列号)为日期
      const excelDate = new Date((date - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return date.toString();
    }
  }

  // 汇总计算方法
  calculateTotals(data) {
    return {
      totalAmount: data.reduce((sum, row) => sum + (row['总金额'] || 0), 0),
      totalItems: data.reduce((sum, row) => sum + (row['数量'] || 0), 0),
      uniqueSuppliers: new Set(data.map(row => row['供应商名称'])).size,
      itemTypes: new Set(data.map(row => row['采购物品'])).size
    };
  }

  // 数据分组方法
  groupBySupplier(data) {
    return data.reduce((groups, row) => {
      const supplier = row['供应商名称'] || 'Unknown';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(row);
      return groups;
    }, {});
  }

  // 数据验证方法
  validateCalculations(data) {
    return data.map(row => {
      const calculated = (row['数量'] || 0) * (row['单价'] || 0);
      const stated = row['总金额'] || 0;
      const difference = Math.abs(calculated - stated);

      return {
        ...row,
        _validationResults: {
          calculationMatch: difference < 0.01,
          difference: difference,
          needsReview: difference >= 0.01
        }
      };
    });
  }
}