import ReactDOM from "react-dom";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import {
  Input,
  Row,
  Col,
  Select,
  Table,
  Typography,
  Button,
  Popconfirm
} from "antd";
import "antd/dist/antd.css";
import "./index.css";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { debounce, isEqual, cloneDeep, sortBy } from "lodash";
const { Text } = Typography;
const { Option } = Select;

const TableComponent = ({}) => {
  const [numRows, setNumRows] = useState(2);
  const [numColumns, setNumColumns] = useState(3);
  const [fileList, setFileList] = useState({
    "Policy 1": [],
    "Policy 2": [],
    "Policy 3": []
  });
  const [quotesFileList, setQuotesFileList] = useState({
    "Policy 1": [],
    "Policy 2": [],
    "Policy 3": []
  });
  // structure states
  let formattedSelectedDropdownValue = {};
  let formattedPortfolioValues = {};
  let formattedTableValues = [];

  const columns = Array(numColumns)
    .fill("")
    .map((item, index) => `Policy ${index + 1}`);

  columns.forEach((item) => {
    formattedPortfolioValues[item] = "";
    let selectedDropdownValueItem = {};
    let newTableValuesItem = {
      targetProduct: "",
      policy: item,
      owner: "",
      valueOfNewPortfolio: "",
      recomendationType: "",
      // alternativeQuotes: null,
      alternativeQuotes: "",
      policyDetails: {
        selected: "",
        otherName: null,
        customFiles: null
      },
      additionalComment: ""
    };

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      selectedDropdownValueItem[`policy${rowIndex + 1}ToConsider`] = "";
      newTableValuesItem[`policy${rowIndex + 1}ToConsider`] = {
        policyId: undefined,
        customValue: undefined
      };
    }
    formattedSelectedDropdownValue[item] = selectedDropdownValueItem;
    formattedTableValues = [...formattedTableValues, newTableValuesItem];
  });

  const scrollEnd = ()=>{
    const ref = document.querySelector(".ant-table-content")
    ref.scrollLeft = 660
  }

  const [tableValues, setTableValues] = useState(
    cloneDeep(formattedTableValues)
  );
  const [tableValuesRef, setTableValuesRef] = useState(
    cloneDeep(formattedTableValues)
  );
  const [policiesWithErrors, setPoliciesWithErrors] = useState([]);
  const [newPortfolioValue, setNewPortfolioValue] = useState(
    formattedPortfolioValues
  );
  const [newDropdownValue, setNewDropdownValue] = useState();

  const [selectedDropdownValue, setSelectedDropdownValue] = useState(
    formattedSelectedDropdownValue
  );

  const dropdownRef = useRef();
  const dispatchDebounce = useRef(debounce((execFunc) => execFunc(), 2000))
    .current;
  const firstUpdate = useRef(true);

  useLayoutEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    let payload = sortBy(tableValues, "policy");
    const response = payload.map((p) => {
      return {
        targetProduct: p.targetProduct,
        owner: p.client || "",
        recomendationType: p.recomendationType,
        alternativeQuotes: p.alternativeQuotes,
        additionalComment: p.additionalComment,
        policyDetails: p.policyDetails
      };
    });
    let shouldDispatch = false;

    for (let i = 0; i < tableValues.length; i++) {
      let data = tableValues[i];
      if (
        !isEqual(
          data,
          tableValuesRef.find((item) => item.policy === data.policy)
        )
      ) {
        if (
          data.policyDetails?.selected &&
          data.owner &&
          data.recomendationType &&
          data.targetProduct
        ) {
          shouldDispatch = true;
          console.log(data.targetProduct);
        } else {
          shouldDispatch = false;
          break;
        }
      }
    }

    dispatchDebounce(async () => {
      if (shouldDispatch) {
        console.log("SOME API CALL");
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableValues]);

  const validateInfo = async () => {
    let policiesWithErrors = [];
    tableValues.forEach((data, index) => {
      if (
        !isEqual(
          data,
          tableValuesRef.find((item) => item.policy === data.policy)
        )
      ) {
        if (
          !data.policyDetails?.selected ||
          !data.owner ||
          !data.recomendationType ||
          !data.targetProduct
        ) {
          policiesWithErrors = [...policiesWithErrors, data.policy];
        }
      }
    });
    setPoliciesWithErrors(policiesWithErrors);

    return policiesWithErrors.length; //TODO: will be edited
  };

  const getValueForComponent = (policy, field, component) => {
    const currentPolicy = tableValues.find((x) => x.policy === policy);
    if (component === "PolicyToConsider") {
      return (
        currentPolicy[field]["policyId"] || currentPolicy[field]["customValue"]
      );
    }
    return currentPolicy[field];
  };

  const validateFields = (policy) => () => {
    if (policiesWithErrors.includes(policy)) validateInfo();
  };

  const setTableValue = (policy, key, value) => {
    const currentPolicyIndex = tableValues.findIndex(
      (x) => x.policy === policy
    );

    const currentPolicy = tableValues.find((x) => x.policy === policy) || {};
    let newPolicy = Object.assign(currentPolicy, { [key]: value });

    setTableValues([
      ...tableValues.slice(0, currentPolicyIndex),
      newPolicy,
      ...tableValues.slice(currentPolicyIndex + 1)
    ]);
  };

  const OwnerComponent = (policy) => {
    return (
      <Select
        showSearch
        value={getValueForComponent(policy, "owner")}
        onChange={(value) => setTableValue(policy, "owner", value)}
        onBlur={validateFields(policy, "owner")}
        style={
          policiesWithErrors.includes(policy) &&
          !getValueForComponent(policy, "owner")
            ? { border: "2px solid red", width: "100%" }
            : { width: "100%" }
        }
      >
        <Option value="client">Client</Option>
        <Option value="partner">Partner</Option>
        <Option value="joint">Joint</Option>
      </Select>
    );
  };

  const targetProductComponent = (policy) => (
    <Input
      value={getValueForComponent(policy, "targetProduct")}
      onChange={(event) =>
        setTableValue(policy, "targetProduct", event.target.value)
      }
      style={
        policiesWithErrors.includes(policy) &&
        !getValueForComponent(policy, "targetProduct")
          ? { border: "2px solid red", width: "100%" }
          : { width: "100%" }
      }
    />
  );

  const PolicyDetailsComponent = (policy) => {
    const value = getValueForComponent(policy, "policyDetails").selected;

    return (
      <div>
        <Select
          showSearch
          onChange={(value) => {
            let obj = {
              selected: value,
              otherName: null,
              customFiles: null
            };
            setTableValue(policy, "policyDetails", obj);
          }}
          onBlur={validateFields(policy, "policyDetails")}
          defaultValue={value}
          value={getValueForComponent(policy, "policyDetails")?.selected}
          style={
            policiesWithErrors.includes(policy) &&
            !getValueForComponent(policy, "policyDetails").selected
              ? { border: "2px solid red", width: "100%" }
              : { width: "100%" }
          }
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          <Option value="retain">Retain - as per fact find</Option>
          <Option value="vary">Vary - uploaded on Xplan</Option>
          <Option value="new">New - uploaded on Xplan</Option>
        </Select>
      </div>
    );
  };

  const RecommendationTypeComponent = (policy) => (
    <Select
      showSearch
      onChange={(value) => setTableValue(policy, "recomendationType", value)}
      value={getValueForComponent(policy, "recomendationType")}
      onBlur={validateFields(policy, "recomendationType")}
      style={
        policiesWithErrors.includes(policy) &&
        !getValueForComponent(policy, "recomendationType")
          ? { border: "2px solid red", width: "100%" }
          : { width: "100%" }
      }
      filterOption={(input, option) =>
        option.toLowerCase().includes(input.toLowerCase())
      }
    >
      <Option value="retain">Retain</Option>
      <Option value="vary">Vary</Option>
      <Option value="new">New</Option>
    </Select>
  );

  const AlternativeQuotesNewComponent = (policy) => {
    return (
      <>
        <Select
          showSearch
          onChange={(value) =>
            setTableValue(policy, "alternativeQuotes", value)
          }
          value={getValueForComponent(policy, "alternativeQuotes")}
          onBlur={validateFields(policy, "alternativeQuotes")}
          style={{ width: "100%" }}
          filterOption={(input, option) =>
            option.toLowerCase().includes(input.toLowerCase())
          }
        >
          <Option value="uploadedToXplan">Uploaded to Xplan</Option>
          <Option value="notRequired">Not Required</Option>
        </Select>
      </>
    );
  };

  const renderAdditionalCommentsComponent = (policy) => (
    <Input
      style={{ width: "100%" }}
      value={getValueForComponent(policy, "additionalComment")}
      onChange={(event) =>
        setTableValue(policy, "additionalComment", event.target.value)
      }
    />
  );

  const renderColumns = (value, row, index) => {
    const obj = {
      children: value,
      props: {}
    };
    if (row.key === "addNewRow") {
      obj.props.colSpan = 0;
    }
    if (row.key === "Policy Details" || row.key === "Alternative Quotes") {
      obj.props.style = { verticalAlign: "baseline" };
    }

    return obj;
  };

  function renderColumnAddButton(customStyle) {
    return (
      <div style={customStyle ? { ...customStyle } : null}>
        <Button
          type="dashed"
          onClick={() => {
            let tableItem = {
              targetProduct: "",
              owner: "",
              policy: `Policy ${numColumns + 1}`,
              recomendationType: "",
              policyDetails: {
                selected: "",
                otherName: null,
                customFiles: null
              },
              alternativeQuotes: null,
              valueOfNewPortfolio: "",
              additionalComment: ""
            };
            let selectedDropdownValueItem = {};
            for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
              tableItem[`policy${rowIndex + 1}ToConsider`] = {
                policyId: undefined,
                customValue: undefined
              };
              selectedDropdownValueItem[`policy${rowIndex + 1}ToConsider`] = "";
            }
            setNewPortfolioValue((prev) => {
              prev[`Policy ${numColumns + 1}`] = "";
              return prev;
            });

            setTableValues((prev) => {
              return [...prev, { ...tableItem }];
            });
            setTableValuesRef((prev) => {
              return [...prev, { ...tableItem }];
            });
            setSelectedDropdownValue((prev) => {
              prev[`Policy ${numColumns + 1}`] = selectedDropdownValueItem;
              return prev;
            });

            setNumColumns((prev) => prev + 1);
            setQuotesFileList((prev) => {
              let policy = `Policy ${numColumns + 1}`;
              return { ...prev, [policy]: [] };
            });
            setFileList((prev) => {
              let policy = `Policy ${numColumns + 1}`;
              return { ...prev, [policy]: [] };
            });
            scrollEnd()
          }}
          style={{ height: "100%" }}
        >
          <PlusOutlined /> Add Policy
        </Button>
      </div>
    );
  }

  function renderAddRowButton() {
    return (
      <Button
        type="dashed"
        onClick={() => {
          setTableValues((prev) => {
            let newData = [...prev];
            newData.map((item) => {
              item[`policy${numRows + 1}ToConsider`] = {
                customValue: undefined,
                policyId: undefined
              };
              return item;
            });
            return newData;
          });
          setTableValuesRef((prev) => {
            let newData = [...prev];
            newData.map((item) => {
              item[`policy${numRows + 1}ToConsider`] = {
                customValue: undefined,
                policyId: undefined
              };
              return item;
            });
            return newData;
          });
          setSelectedDropdownValue((prev) => {
            let newData = Object.assign({}, prev);
            Object.keys(prev).forEach(
              (item) => (newData[item][`policy${numRows + 1}ToConsider`] = "")
            );
            return newData;
          });
          setNumRows((prev) => prev + 1);
        }}
        style={{ width: "100%" }}
      >
        <span>
          <PlusOutlined /> Add Policy to consider
        </span>
      </Button>
    );
  }

  const deletePolicy = (index) => {
    setTableValues((prev) => {
      let after = [...prev.slice(index + 1)];
      after.forEach((item, i) => {
        item.policy = `Policy ${index + 1 + i}`;
      });
      console.log([...prev.slice(0, index), ...prev.slice(index + 1)], after);
      return [...prev.slice(0, index), ...after];
    });

    setTableValuesRef((prev) => {
      let after = [...prev.slice(index + 1)];
      after.forEach((item, i) => {
        item.policy = `Policy ${index + 1 + i}`;
      });
      return [...prev.slice(0, index), ...after];
    });

    setNumColumns((prev) => prev - 1);

    setPoliciesWithErrors((prev) => {
      let errorIndex = prev.findIndex((p) => p === `Policy ${index + 1}`);
      return [...prev.slice(0, errorIndex), ...prev.slice(errorIndex + 1)];
    });

    setFileList((prev) => {
      let keys = [...Object.keys(prev).sort()];

      let deleted = false;

      keys.forEach((key, i) => {
        if (deleted) {
          Object.defineProperty(
            prev,
            `Policy ${i}`,
            Object.getOwnPropertyDescriptor(prev, key)
          );
          delete prev[key];
        }
        if (i === index && !deleted) {
          delete prev[`Policy ${index + 1}`];
          deleted = true;
        }
      });

      return prev;
    });

    setQuotesFileList((prev) => {
      let keys = [...Object.keys(prev).sort()];

      let deleted = false;

      keys.forEach((key, i) => {
        if (deleted) {
          Object.defineProperty(
            prev,
            `Policy ${i}`,
            Object.getOwnPropertyDescriptor(prev, key)
          );
          delete prev[key];
        }
        if (i === index && !deleted) {
          delete prev[`Policy ${index + 1}`];
          deleted = true;
        }
      });

      return prev;
    });
  };

  const generateColumns = () => {
    let columns = [
      {
        title: "",
        fixed: "left",
        dataIndex: "firstColumn",
        key: "firstColumn",
        render: (text, row, index) => {
          if (row.key === "addNewRow") {
            return {
              children: text,
              props: {
                colSpan: numColumns + 1
              }
            };
          }
          return (
            <>
              <Text strong>{text}</Text>
              {text === "Alternative Quotes" ? (
                <>
                  <br />
                  <Text type="secondary">
                    Please upload any additional quotations
                  </Text>
                </>
              ) : null}
            </>
          );
        }
      }
    ];
    for (let colsIndex = 0; colsIndex < numColumns; colsIndex++) {
      columns = [
        ...columns,
        {
          textWrap: "word-break",
          className: "insurance-platform-column",
          title: () => {
            return (
              <div className="custom-header">
                <span>{`Policy ${colsIndex + 1}`}</span>
                <span className="policy-delete-btn">
                  <Popconfirm
                    title="Are you sure you want to delete this insurance policy?"
                    onConfirm={() => {
                      console.log(colsIndex);
                      deletePolicy(colsIndex);
                    }}
                    onCancel={() => {}}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button icon={<DeleteOutlined />} type="text" />
                  </Popconfirm>
                </span>
              </div>
            );
          },
          dataIndex: `policy${colsIndex + 1}`,
          key: `policy${colsIndex + 1}`,
          render: renderColumns
        }
      ];
    }
    columns = [
      ...columns,
      {
        textWrap: "word-break",
        ellipsis: true,
        key: `addColumn`,
        dataIndex: "addColumn",
        fixed: "right",
        className: "insurance-add-platform-column",
        render: (text, row, index) => {
          return {
            children: text,
            props: {
              rowSpan: row.key === "targetProduct" ? numRows + 5 : 0
            }
          };
        }
      }
    ];
    return columns;
  };

  const generateRows = () => {
    function mapFuncToValues(func) {
      let item = {};
      for (let colsIndex = 0; colsIndex < numColumns; colsIndex++) {
        item[`policy${colsIndex + 1}`] = func(`Policy ${colsIndex + 1}`);
      }
      return item;
    }
    let staticRows = [
      {
        key: "addNewRow",
        firstColumn: renderAddRowButton()
      },
      {
        key: "Recommendation Type",
        firstColumn: "Recommendation Type",
        ...mapFuncToValues(RecommendationTypeComponent)
      },

      {
        key: "Policy Details",
        firstColumn: "Policy Details",
        ...mapFuncToValues(PolicyDetailsComponent)
      },
      {
        key: "Alternative Quotes",
        firstColumn: "Alternative Quotes",
        ...mapFuncToValues(AlternativeQuotesNewComponent)
      },
      {
        key: "Additional comments",
        firstColumn: "Additional comments",
        ...mapFuncToValues(renderAdditionalCommentsComponent)
      }
    ];

    let data = [
      {
        key: "targetProduct",
        firstColumn: "Name of Policy",
        ...mapFuncToValues(targetProductComponent),
        addColumn: renderColumnAddButton({ transform: "rotate(90deg)" })
      },
      {
        key: "Owner",
        firstColumn: "Owner",
        ...mapFuncToValues(OwnerComponent)
      }
    ];

    staticRows = staticRows.slice(1);
    return [...data, ...staticRows];
  };

  return (
    <>
      <Table
        // size='small'
        scroll={{ x: true }}
        pagination={false}
        columns={generateColumns()}
        dataSource={generateRows()}
      />
    </>
  );
};

export default TableComponent;

ReactDOM.render(<TableComponent />, document.getElementById("container"));
