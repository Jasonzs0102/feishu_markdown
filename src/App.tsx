import { useState, useEffect } from 'react';
import { bitable, FieldType, ITable } from '@lark-base-open/js-sdk';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

function App() {
  // 状态定义
  const [textFields, setTextFields] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [record, setRecord] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 初始化获取表格和字段信息
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        console.log('正在初始化飞书SDK...');
        
        // 确保bitable对象可用
        if (!bitable) {
          throw new Error('飞书SDK未正确加载，请确保在飞书多维表格环境中运行');
        }

        // 添加调试信息
        setDebugInfo(prev => prev + '• 开始初始化SDK\n');
        
        // 获取当前环境信息
        try {
          const env = await bitable.bridge.getEnv();
          setDebugInfo(prev => prev + `• 当前环境: ${JSON.stringify(env)}\n`);
        } catch (envError) {
          console.error('无法获取环境信息:', envError);
          setDebugInfo(prev => prev + `• 获取环境失败: ${envError}\n`);
        }
        
        // 添加超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('获取表格超时，请检查网络连接')), 15000);
        });
        
        setDebugInfo(prev => prev + '• 尝试获取当前表格\n');
        const tablePromise = bitable.base.getActiveTable();
        const table = await Promise.race([tablePromise, timeoutPromise]) as ITable;
        console.log('成功获取表格');
        setDebugInfo(prev => prev + '• 成功获取表格\n');
        
        // 获取表格名称用于调试
        try {
          const tableName = await table.getName();
          setDebugInfo(prev => prev + `• 表格名称: ${tableName}\n`);
        } catch (nameError) {
          setDebugInfo(prev => prev + `• 获取表格名称失败\n`);
        }
        
        // 获取所有文本类型字段
        setDebugInfo(prev => prev + '• 尝试获取字段列表\n');
        const fields = await table.getFieldMetaList();
        console.log('获取到字段列表:', fields.length);
        setDebugInfo(prev => prev + `• 获取到字段列表: ${fields.length}个\n`);
        
        const textFieldsList = fields.filter(field => 
          field.type === FieldType.Text
        );
        console.log('文本类型字段数量:', textFieldsList.length);
        setDebugInfo(prev => prev + `• 文本类型字段数量: ${textFieldsList.length}个\n`);
        
        if (textFieldsList.length > 0) {
          setDebugInfo(prev => prev + `• 第一个文本字段: ${textFieldsList[0].name} (${textFieldsList[0].id})\n`);
        }
        
        setTextFields(textFieldsList);
        if (textFieldsList.length > 0) {
          setSelectedFields([textFieldsList[0].id]);
        }
        
        // 监听选择变化
        setDebugInfo(prev => prev + '• 设置选择监听器\n');
        const off = bitable.base.onSelectionChange(async () => {
          setDebugInfo(prev => prev + '• 选择变化被触发\n');
          await updateSelectedRecord();
        });
        
        // 初始获取选中记录
        setDebugInfo(prev => prev + '• 尝试获取初始选中记录\n');
        await updateSelectedRecord();
        
        return () => off();
      } catch (error) {
        console.error('初始化失败:', error);
        setDebugInfo(prev => prev + `• 初始化失败: ${error instanceof Error ? error.message : String(error)}\n`);
        setError(error instanceof Error ? error.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // 更新选中记录信息
  const updateSelectedRecord = async () => {
    try {
      console.log('正在获取选中记录...');
      setDebugInfo(prev => prev + '• 正在获取选中记录...\n');
      
      const selection = await bitable.base.getSelection();
      
      if (!selection) {
        setDebugInfo(prev => prev + '• 无法获取选择信息\n');
        return;
      }
      
      setDebugInfo(prev => prev + `• 选择信息: ${JSON.stringify(selection)}\n`);
      
      if (selection.tableId && selection.recordId) {
        const table = await bitable.base.getTableById(selection.tableId);
        const recordData = await table.getRecordById(selection.recordId);
        setRecord(recordData);
        console.log('成功获取记录数据', recordData);
        setDebugInfo(prev => prev + `• 成功获取记录数据, 字段数: ${Object.keys(recordData.fields).length}\n`);
        
        // 记录所有字段的ID用于调试
        setDebugInfo(prev => prev + `• 记录中的字段ID: ${Object.keys(recordData.fields).join(', ')}\n`);
        
        // 获取各字段的值
        const values: {[key: string]: string} = {};
        
        // 改进的字段处理方法
        for (const field of textFields) {
          try {
            setDebugInfo(prev => prev + `• 正在处理字段 ${field.name} (${field.id})...\n`);
            const value = recordData.fields[field.id];
            
            setDebugInfo(prev => prev + `  - 原始值类型: ${value === undefined ? 'undefined' : (value === null ? 'null' : typeof value)}\n`);
            if (value !== undefined && value !== null) {
              setDebugInfo(prev => prev + `  - 是数组: ${Array.isArray(value)}, 值: ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}\n`);
            }
            
            // 直接尝试从单元格获取格式化文本
            try {
              // 尝试直接从表格获取格式化文本
              const cell = await table.getCellValue(field.id, selection.recordId);
              setDebugInfo(prev => prev + `  - 直接获取cell值: ${JSON.stringify(cell).substring(0, 100)}${JSON.stringify(cell).length > 100 ? '...' : ''}\n`);
              
              // 检查字段的格式化文本
              try {
                const formattedValue = await table.getCellString(field.id, selection.recordId);
                setDebugInfo(prev => prev + `  - 格式化文本: ${formattedValue ? formattedValue.substring(0, 100) : '无'}${formattedValue && formattedValue.length > 100 ? '...' : ''}\n`);
                
                if (formattedValue) {
                  values[field.id] = formattedValue;
                  setDebugInfo(prev => prev + `  - 使用格式化文本值\n`);
                  continue; // 成功获取格式化文本，跳过下面的处理
                }
              } catch (fmtError) {
                setDebugInfo(prev => prev + `  - 获取格式化文本失败: ${fmtError}\n`);
              }
            } catch (cellError) {
              setDebugInfo(prev => prev + `  - 直接获取cell值失败: ${cellError}\n`);
            }
            
            // 如果上面的方法失败，使用原来的逻辑处理
            if (value === undefined || value === null) {
              values[field.id] = '';
              setDebugInfo(prev => prev + `  - 设置为空字符串\n`);
            } else if (Array.isArray(value)) {
              if (value.length > 0) {
                // 处理文本段落数组
                if (typeof value[0] === 'object' && value[0] && value[0].hasOwnProperty('text')) {
                  values[field.id] = value.map((segment: any) => segment.text || '').join('');
                  setDebugInfo(prev => prev + `  - 处理为文本段落: "${values[field.id].substring(0, 50)}${values[field.id].length > 50 ? '...' : ''}"\n`);
                } else {
                  values[field.id] = value.join(', ');
                  setDebugInfo(prev => prev + `  - 处理为普通数组: "${values[field.id].substring(0, 50)}${values[field.id].length > 50 ? '...' : ''}"\n`);
                }
              } else {
                values[field.id] = '';
                setDebugInfo(prev => prev + `  - 空数组, 设置为空字符串\n`);
              }
            } else if (typeof value === 'object') {
              // 处理其他对象类型
              values[field.id] = JSON.stringify(value);
              setDebugInfo(prev => prev + `  - 处理为对象: "${values[field.id].substring(0, 50)}${values[field.id].length > 50 ? '...' : ''}"\n`);
            } else {
              // 处理基本类型(string, number等)
              values[field.id] = String(value);
              setDebugInfo(prev => prev + `  - 处理为基本类型: "${values[field.id].substring(0, 50)}${values[field.id].length > 50 ? '...' : ''}"\n`);
            }
          } catch (fieldError) {
            setDebugInfo(prev => prev + `• 处理字段${field.name}时出错: ${fieldError}\n`);
            values[field.id] = `处理出错: ${fieldError instanceof Error ? fieldError.message : String(fieldError)}`;
          }
        }
        
        console.log('处理后的字段值:', values);
        setDebugInfo(prev => prev + `• 所有处理后的字段: ${Object.keys(values).length}个\n`);
        setFieldValues(values);
      } else {
        console.log('未选中任何记录');
        setDebugInfo(prev => prev + '• 未选中任何记录\n');
      }
    } catch (error) {
      console.error('获取记录失败:', error);
      setDebugInfo(prev => prev + `• 获取记录失败: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  };
  
  // 切换字段选择
  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };
  
  // 手动刷新
  const handleRefresh = async () => {
    setDebugInfo('• 手动刷新开始\n');
    setLoading(true);
    setError(null);
    
    try {
      const selection = await bitable.base.getSelection();
      setDebugInfo(prev => prev + `• 当前选择: ${JSON.stringify(selection)}\n`);
      
      if (selection && selection.tableId) {
        const table = await bitable.base.getTableById(selection.tableId);
        const fields = await table.getFieldMetaList();
        
        const textFieldsList = fields.filter(field => 
          field.type === FieldType.Text
        );
        
        setTextFields(textFieldsList);
        setDebugInfo(prev => prev + `• 获取到${textFieldsList.length}个文本字段\n`);
        
        if (textFieldsList.length > 0 && selectedFields.length === 0) {
          setSelectedFields([textFieldsList[0].id]);
        }
        
        await updateSelectedRecord();
      }
    } catch (error) {
      console.error('刷新失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      setDebugInfo(prev => prev + `• 刷新失败: ${error instanceof Error ? error.message : String(error)}\n`);
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染UI
  if (loading) {
    return (
      <div className="loading">
        <p>加载中...<br/>请确保在飞书多维表格环境中运行此插件</p>
        <details open>
          <summary>调试信息</summary>
          <pre className="debug-info">{debugInfo}</pre>
        </details>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h3>加载失败</h3>
        <p>{error}</p>
        <p>请确保：</p>
        <ul>
          <li>此插件在飞书多维表格环境中运行</li>
          <li>已授予插件访问表格的权限</li>
          <li>网络连接正常</li>
        </ul>
        <button 
          onClick={handleRefresh}
          className="retry-button"
        >
          重试
        </button>
        <details open>
          <summary>调试信息</summary>
          <pre className="debug-info">{debugInfo}</pre>
        </details>
      </div>
    );
  }
  
  return (
    <div className="app-container">
      <div className="field-selector">
        <h3>选择需要预览的字段：</h3>
        <div className="field-list">
          {textFields.length > 0 ? (
            textFields.map(field => (
              <label key={field.id} className="field-item">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleFieldSelection(field.id)}
                />
                {field.name}
              </label>
            ))
          ) : (
            <div>未找到文本类型字段</div>
          )}
        </div>
        <button 
          onClick={handleRefresh}
          className="refresh-button"
        >
          刷新数据
        </button>
      </div>
      
      {!record ? (
        <div className="no-selection">
          <p>请选择一条记录</p>
          <p className="tip">提示：在表格中点击选择一行记录</p>
        </div>
      ) : (
        <div className="preview-container">
          {selectedFields.length === 0 ? (
            <div className="no-field">请选择至少一个字段进行预览</div>
          ) : (
            <div className="markdown-previews">
              {selectedFields.map(fieldId => {
                const field = textFields.find(f => f.id === fieldId);
                return (
                  <div key={fieldId} className="markdown-preview-item">
                    <h3>
                      {field?.name} 
                      {fieldValues[fieldId] === undefined && <span> (无值)</span>}
                      {fieldValues[fieldId] === '' && <span> (空值)</span>}
                    </h3>
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fieldValues[fieldId] || '*无内容*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      <details className="debug-panel" open>
        <summary>调试面板</summary>
        <pre className="debug-info">{debugInfo}</pre>
        <div style={{marginTop: '12px'}}>
          <strong>选中字段：</strong> {selectedFields.join(', ') || '无'}
        </div>
        <div style={{marginTop: '8px'}}>
          <strong>字段值状态：</strong>
          <pre className="debug-info">
            {JSON.stringify(fieldValues, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

export default App; 